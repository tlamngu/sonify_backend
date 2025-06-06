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

        const { role: requestUserRole } = req.user; // Role of the user making the request
        const {
            role: roleQueryParam,        // from req.query.role for explicit filtering
            username: usernameQueryParam, // from req.query.username for searching
            email: emailQueryParam        // from req.query.email for searching
        } = req.query;

        const filter = { is_deleted: false };

        // Default behavior from 'thanh' branch logic: if the requesting user is an admin,
        // the list should exclude other admins by default.
        if (requestUserRole === 'admin') {
            filter.role = { $ne: 'admin' };
        }

        // Allow explicit role filtering via query parameter.
        // This can be used by an admin to override the default (e.g., to see other admins)
        // or by any user to filter by a specific role.
        if (roleQueryParam) {
            if (VALID_ROLES.includes(roleQueryParam)) {
                filter.role = roleQueryParam; // This will override the {$ne: 'admin'} if admin queries for a specific role.
            } else {
                return sendError(res, 400, `Invalid role specified for filtering. Valid roles are: ${VALID_ROLES.join(', ')}.`);
            }
        }

        // 'main' branch logic (corrected to use query parameters for searching)
        if (usernameQueryParam) {
            filter.username = { $regex: usernameQueryParam, $options: 'i' };
        }
        if (emailQueryParam) {
            filter.email = { $regex: emailQueryParam, $options: 'i' };
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
            // filters: { role: roleQueryParam, username: usernameQueryParam, email: emailQueryParam }, // Example if you want to return active filters
            // sorting: { sortBy, sortOrder },
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
    const adminUserId = req.user._id; // Not used in current logic but kept for context

    // Validate file presence and type
    if (!req.file || !req.file.buffer || !req.file.mimetype || !req.file.mimetype.startsWith('image/')) {
        console.warn(`Invalid file or mimetype uploaded by ${req.user.username}: ${req.file ? req.file.mimetype : 'No file'}`);
        return sendError(res, 400, 'Invalid file type or missing file data. Only image files are allowed.');
    }

    if (!mongoose.Types.ObjectId.isValid(userID)) {
        return sendError(res, 400, 'Invalid User ID format.');
    }

    const allowedUpdates = [
        'username',
        'phone_number',
        // 'profile_image_path', // This will be set from Cloudinary result
        'is_email_verified'
    ];
    const updates = {};
    Object.keys(req.body).forEach((key) => {
        if (allowedUpdates.includes(key)) {
            if (req.body[key] !== undefined && req.body[key] !== null) { // Ensure value is provided
                 updates[key] = req.body[key];
            }
        }
    });

    try {
        const folderImagePath = `image/${userID}`;
        const cloudinaryImageResult = await uploadImagetoCloudinary(req.file, folderImagePath);
        console.log("Cloudinary Upload Image Success: ", cloudinaryImageResult.public_id);
        updates.profile_image_path = cloudinaryImageResult.url;

        if (Object.keys(updates).length === 0 && !updates.profile_image_path) { // Check if only profile image was to be updated
             return sendError(res, 400, 'No valid fields provided for update, or only profile image was updated which is handled.', { allowedFields: allowedUpdates });
        }
         if (Object.keys(updates).length === 1 && updates.profile_image_path) {
            // This case means only profile_image_path was updated, which is fine.
            // The previous check was too strict.
        } else if (Object.keys(updates).length === 0) {
             return sendError(res, 400, 'No valid fields provided for update.', { allowedFields: allowedUpdates });
        }


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

        const suffix = `_deleted_${Date.now()}`;
        user.is_deleted = true;
        user.email = `${user.email}${suffix}`;
        user.username = `${user.username}${suffix}`;
        if(user.phone_number) {
            user.phone_number = `${user.phone_number}${suffix}`;
        }

        if (user.access_tokens && user.access_tokens.length > 0) {
            user.access_tokens.forEach(token => {
                token.is_deleted = true;
            });
        }
        await user.save();

        if (user.role === 'artist') {
            const artistProfile = await Artist.findOne({ user_id: userID });
            if (artistProfile) {
                await Artist.updateOne({ user_id: userID }, { $set: { is_deleted: true, name: `${artistProfile.name}${suffix}` } });
                console.log(`Soft deleted associated artist profile for user ${userID}`);
            }
        }
        await UserSettings.updateOne({ user_id: userID }, { $set: { /* maybe clear preferences or mark as inactive */ } });
         console.log(`Handled user settings for deleted user ${userID}`);
        sendSuccess(res, 200, 'User deleted successfully.');

    } catch (error) {
        console.error(`Error deleting user ${userID}:`, error);
        next(error);
    }
};

export const changeUserDetailManager = async (req, res) => {
    try {
        const { _id, username, role } = req.body;

        if (!_id || !username || !role) {
            return sendError(res, 400, "Missing required fields: _id, username, or role.");
        }

        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return sendError(res, 400, 'Invalid User ID format for _id field.');
        }

        // Use the global VALID_ROLES
        if (!VALID_ROLES.includes(role)) {
            return sendError(res, 400, `Invalid role. Valid roles are: ${VALID_ROLES.join(', ')}.`);
        }

        const userToUpdate = await User.findById(_id);

        if (!userToUpdate) {
            return sendError(res, 404, "User not found.");
        }

        // Prevent admin from changing their own role this way or demoting last admin (add more robust checks if needed)
        if (userToUpdate._id.toString() === req.user._id.toString() && userToUpdate.role === 'admin' && role !== 'admin') {
            return sendError(res, 403, "Admins cannot change their own role to a non-admin role via this endpoint.");
        }
        
        // Add additional logic if there's a need to manage artist profile based on role change here as well
        const oldRole = userToUpdate.role;

        userToUpdate.username = username;
        userToUpdate.role = role;

        const updatedUser = await userToUpdate.save();


        // Handle artist profile changes if role changes to/from artist (similar to updateUserRole)
        let artistProfileStatus = null;
        if (role === 'artist' && oldRole !== 'artist') {
            // Logic to check/create artist profile
            let artistProfile = await Artist.findOne({ user_id: updatedUser._id });
            if (!artistProfile) {
                const defaultArtistName = updatedUser.username;
                const nameExists = await Artist.findOne({ name: defaultArtistName, is_deleted: false });
                if (!nameExists) {
                    await Artist.create({ user_id: updatedUser._id, name: defaultArtistName });
                    artistProfileStatus = `Created artist profile for ${updatedUser.username}.`;
                } else {
                    artistProfileStatus = `Artist profile not auto-created for ${updatedUser.username}, name taken. Manual creation needed.`;
                }
            } else if (artistProfile.is_deleted) {
                artistProfile.is_deleted = false;
                await artistProfile.save();
                artistProfileStatus = `Reactivated artist profile for ${updatedUser.username}.`;
            }
        } else if (oldRole === 'artist' && role !== 'artist') {
            // Logic to soft-delete artist profile
            await Artist.updateOne({ user_id: updatedUser._id, is_deleted: false }, { $set: { is_deleted: true }});
            artistProfileStatus = `Soft-deleted artist profile for ${updatedUser.username} due to role change.`;
        }


        sendSuccess(res, 200, 'User details updated successfully.', {
            user: sanitizeUserOutput(updatedUser),
            artistProfileStatus: artistProfileStatus
        });

    } catch (err) {
        console.error("Error updating user detail:", err);
        if (err.code === 11000) { // Handle duplicate key errors (e.g. username already taken)
            const field = Object.keys(err.keyPattern)[0];
            return sendError(res, 409, `Update failed: The ${field} '${err.keyValue[field]}' is already in use.`);
        }
        sendError(res, 500, "Failed to update user detail.", err.message);
    }
};