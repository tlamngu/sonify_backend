import mongoose from 'mongoose';
import User from '../models/user.model.js'; 
import Artist from '../models/artist.model.js'; 
import UserSettings from '../models/userSettings.model.js'; 
import { sendSuccess, sendError } from '../utils/responseUtils.js';
import { sanitizeUserOutput } from '../utils/sanitizeUser.js'; 
import { uploadImagetoCloudinary } from '../utils/cdnUtils.js';

const VALID_ROLES = ['user', 'admin', 'moderator', 'artist'];

export const listUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'createdAt'; 
        const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1; 
        const role = req.query.role;
        const username = req.query.username;
        const email = req.query.email;

        const filter = { is_deleted: false }; 
        if (role) {
            if (VALID_ROLES.includes(role)) {
                filter.role = role;
            } else {
                return sendError(res, 400, `Invalid role specified. Valid roles are: ${VALID_ROLES.join(', ')}.`);
            }
        }
        if (username) {
            filter.username = { $regex: username, $options: 'i' };
        }
         if (email) {
            filter.email = { $regex: email, $options: 'i' };
        }


        const sort = {};
        sort[sortBy] = sortOrder;

        const skip = (page - 1) * limit;

        const totalUsers = await User.countDocuments(filter);
        const users = await User.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .select('-password_hash -access_tokens');

        const sanitizedUsers = users.map(user => sanitizeUserOutput(user)); 

        const totalPages = Math.ceil(totalUsers / limit);

        sendSuccess(res, 200, {
            users: sanitizedUsers,
            pagination: {
                page,
                limit,
                totalPages,
                totalUsers,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            filters: { role, username, email },
            sorting: { sortBy, sortOrder },
        }, 'Users retrieved successfully.');

    } catch (error) {
        console.error("Error listing users:", error);
        next(error); 
    }
};

export const updateUserRole = async (req, res, next) => {
    const { userID } = req.params;
    const { role: newRole } = req.body;
    const adminUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userID)) {
        return sendError(res, 400, 'Invalid User ID format.');
    }
    if (!newRole || !VALID_ROLES.includes(newRole)) {
        return sendError(res, 400, `Invalid or missing role. Valid roles are: ${VALID_ROLES.join(', ')}.`);
    }

    if (userID === adminUserId.toString()) {
        return sendError(res, 403, 'Admins cannot change their own role via this endpoint.');
    }

    let artistProfileStatus = null; 

    try {
        const user = await User.findOne({ _id: userID, is_deleted: false });

        if (!user) {
            return sendError(res, 404, 'User not found or has been deleted.');
        }

        const oldRole = user.role;

        if (oldRole === newRole) {
             return sendSuccess(res, 200, 'User role is already set to the requested value.', {
                 user: sanitizeUserOutput(user),
             });
        }

        user.role = newRole;
        await user.save(); 

        if (newRole === 'artist' && oldRole !== 'artist') {
            console.log(`User ${userID} role changed to 'artist'. Checking/creating artist profile.`);

            try {
                let artistProfile = await Artist.findOne({ user_id: userID });

                if (artistProfile) {
                    if (artistProfile.is_deleted) {
                        artistProfile.is_deleted = false;
                        await artistProfile.save();
                        artistProfileStatus = `Reactivated existing soft-deleted artist profile for user ${userID}.`;
                        console.log(artistProfileStatus);
                    } else {
                        artistProfileStatus = `User ${userID} already had an active artist profile. No action needed.`;
                        console.log(artistProfileStatus);
                    }
                } else {
                    const defaultArtistName = user.username; // Use username as default artist name
                    console.log(`Attempting to create new artist profile for ${userID} with default name: ${defaultArtistName}`);

                    const nameExists = await Artist.findOne({ name: defaultArtistName, is_deleted: false });
                    if (nameExists) {
                         artistProfileStatus = `Failed to automatically create artist profile for ${userID}. The default name ('${defaultArtistName}') is already taken by another active artist. Please update the artist profile manually.`;
                         console.warn(artistProfileStatus);
                    } else {
                        const newArtist = new Artist({
                            user_id: userID,
                            name: defaultArtistName,
                        });
                        await newArtist.save();
                        artistProfileStatus = `Successfully created a new artist profile for user ${userID} with default name '${defaultArtistName}'.`;
                        console.log(artistProfileStatus);
                    }
                }
            } catch (artistError) {
                 if (artistError.code === 11000 && artistError.keyPattern?.name) {
                     artistProfileStatus = `Failed to automatically create artist profile for ${userID}. The default name ('${user.username}') caused a conflict (already exists). Please update the artist profile manually.`;
                      console.error(artistProfileStatus, artistError.message);
                 } else {
                    artistProfileStatus = `An error occurred while managing the artist profile for user ${userID}. Please check manually. Error: ${artistError.message}`;
                    console.error(artistProfileStatus, artistError);
                 }
            }
        } else if (oldRole === 'artist' && newRole !== 'artist') {
             console.log(`User ${userID} role changed from artist to ${newRole}. Consider soft-deleting the associated Artist record.`);
             try {
                const result = await Artist.updateOne(
                    { user_id: userID, is_deleted: false },
                    { $set: { is_deleted: true } }
                );
                if (result.modifiedCount > 0) {
                    artistProfileStatus = `Soft-deleted the associated artist profile for user ${userID} as their role changed from 'artist'.`;
                    console.log(artistProfileStatus);
                }
             } catch (deleteError) {
                 artistProfileStatus = `Role changed from artist, but failed to soft-delete artist profile for user ${userID}. Error: ${deleteError.message}`;
                 console.error(artistProfileStatus, deleteError);
             }
        }

        sendSuccess(res, 200, 'User role updated successfully.', {
             user: sanitizeUserOutput(user),
             artistProfileStatus: artistProfileStatus 
        });

    } catch (error) {
         if (error.code === 11000) {
             const field = Object.keys(error.keyPattern)[0];
             return sendError(res, 409, `Update failed: The ${field} '${error.keyValue[field]}' is already in use.`);
         }
        console.error(`Error updating role for user ${userID}:`, error);
        next(error);
    }
};

export const editUserProfile = async (req, res, next) => {
    const { userID } = req.params;
    const adminUserId = req.user._id;
    if(!req.file.buffer || !req.file.mimetype || !req.file.mimetype.startsWith('image/')){
        console.warn(`Invalid file or mimetype uploaded by ${req.user.username}: ${req.file.mimetype}`);
        return res.status(400).json({message: 'Invalid file type or missing file data. Only image files are allowed.'})
    }
    if (!mongoose.Types.ObjectId.isValid(userID)) {
        return sendError(res, 400, 'Invalid User ID format.');
    }

    const allowedUpdates = [
        'username',
        'phone_number',
        'profile_image_path',
        'is_email_verified' 
    ];
    const updates = {};
    Object.keys(req.body).forEach((key) => {
        if (allowedUpdates.includes(key)) {
            updates[key] = req.body[key];
        }
    });
    const folderImagePath =`image/${userID}`
    const cloudinaryImageResult=await uploadImagetoCloudinary(req.file,folderImagePath)
    console.log("Cloudinary Upload Image Success: ",cloudinaryImageResult.public_id)
    updates.profile_image_path=cloudinaryImageResult.url
    if (Object.keys(updates).length === 0) {
        return sendError(res, 400, 'No valid fields provided for update.', { allowedFields: allowedUpdates });
    }

    try {
        const user = await User.findOne({ _id: userID, is_deleted: false });

        if (!user) {
            return sendError(res, 404, 'User not found or has been deleted.');
        }

        Object.assign(user, updates);

        await user.save();

        sendSuccess(res, 200, 'User profile updated successfully.', {
            user: sanitizeUserOutput(user),
        });

    } catch (error) {
        console.error(`Error editing profile for user ${userID}:`, error);
        if (error.code === 11000) { 
            const field = Object.keys(error.keyPattern)[0];
             return sendError(res, 409, `Update failed: The ${field} '${error.keyValue[field]}' is already in use.`);
        }
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    const { userID } = req.params;
    const adminUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userID)) {
        return sendError(res, 400, 'Invalid User ID format.');
    }

    if (userID === adminUserId.toString()) {
        return sendError(res, 403, 'Admins cannot delete their own account.');
    }

    try {
        const user = await User.findOne({ _id: userID, is_deleted: false });

        if (!user) {
            return sendError(res, 404, 'User not found or already deleted.');
        }

        if (user.role === 'admin') {
            return sendError(res, 403, 'Cannot delete another admin account.');
        }

        user.is_deleted = true;
        user.email = `${user.email}_deleted_${Date.now()}`; // Obfuscate unique fields if necessary
        user.username = `${user.username}_deleted_${Date.now()}`; // Handle potential unique constraint on re-registration
        if(user.phone_number) {
            user.phone_number = `${user.phone_number}_deleted_${Date.now()}`;
        }

        if (user.access_tokens && user.access_tokens.length > 0) {
            user.access_tokens.forEach(token => {
                token.is_deleted = true;
            });
        }
        await user.save();
        if (user.role === 'artist') {
            await Artist.updateOne({ user_id: userID }, { $set: { is_deleted: true, name: `${Artist.name}_deleted_${Date.now()}` } }); // Also handle unique name
             console.log(`Soft deleted associated artist profile for user ${userID}`);
        }
        await UserSettings.updateOne({ user_id: userID }, { $set: { /* maybe clear preferences or mark as inactive */ } });
         console.log(`Handled user settings for deleted user ${userID}`);
        sendSuccess(res, 200, 'User deleted successfully.');

    } catch (error) {
        console.error(`Error deleting user ${userID}:`, error);
        next(error);
    }
};