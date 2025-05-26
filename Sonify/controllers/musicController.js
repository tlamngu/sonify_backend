import mongoose, { Schema, Types } from 'mongoose';
import { parseBuffer } from 'music-metadata';
import https from 'https';
import stream from 'stream';
import { promisify } from 'util';
import cloudinary from 'cloudinary';
import Album from "../models/album.model.js"
import Artist from "../models/artist.model.js"
import { uploadImagetoCloudinary, uploadToCloudinary } from "../utils/cdnUtils.js";
import { generateAssetToken, verifyAssetToken } from "../utils/assetTokenUtils.js";
import Music from "../models/music.model.js"
import StreamTracking from '../models/streamTracking.model.js';
import { sendSuccess, sendError } from '../utils/responseUtils.js';
import { console } from 'inspector';

const pipeline = promisify(stream.pipeline);

export const uploadMusic = async (req, res) => {
    console.log("Uploading music...")
    try {
        if (!req.user || !req.user._id || !req.user.username) {
            return res.status(401).json({ message: 'Unauthorized: User information missing or invalid token.' });
        }
        console.log("Music Upload Requested By:", req.user.username);
       if(!req.files.coverImage){
        return res.status(400).json({ message: 'No image file provided.' });
       } 
        if (!req.files.coverImage[0].buffer || !req.files.coverImage[0].mimetype || !req.files.coverImage[0].mimetype.startsWith('image/')){
            console.warn(`Invalid file or mimetype uploaded by ${req.user.username}: ${req.files.coverImage[0].mimetype}`);
            return res.status(400).json({ message: 'Invalid file type or missing file data. Only image files are allowed.' });
        }
        if (!req.files.audioFile) {
            return res.status(400).json({ message: 'No music file provided.' });
        }
        if (!req.files.audioFile[0].buffer || !req.files.audioFile[0].mimetype || !req.files.audioFile[0].mimetype.startsWith('audio/')) {
             console.warn(`Invalid file or mimetype uploaded by ${req.user.username}: ${req.files.audioFile[0].mimetype}`);
             return res.status(400).json({ message: 'Invalid file type or missing file data. Only audio files are allowed.' });
        }

        const {
            title,
            collaborators,
            album_id,
            genre_id,
            release_date,
            credits
        } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Missing required field: title.' });
        }

        console.log(`Received metadata: Title - ${title}`);
        console.log(`Processing file "${req.files.audioFile[0].originalname}"...`);

        let durationMs = 0;
        try {
            const metadata = await parseBuffer(req.files.audioFile[0].buffer, req.files.audioFile[0].mimetype);
            if (metadata?.format?.duration) {
                durationMs = Math.round(metadata.format.duration * 1000);
                console.log(`Calculated duration: ${durationMs} ms`);
            } else {
                console.warn(`Could not extract duration for file: ${req.files.audioFile[0].originalname}`);
                 return res.status(400).json({ message: 'Failed to calculate audio duration. File might be corrupted or format unsupported.' });
            }
        } catch (durationError) {
            console.error(`Error calculating duration for ${req.files.audioFile[0].originalname}:`, durationError);
             return res.status(400).json({ message: `Error processing audio file: ${durationError.message}` });
        }

        const folderPath = `audio/${req.user._id}`;
        console.log(`Uploading audio to Cloudinary folder: ${folderPath}`);
        const cloudinaryResult = await uploadToCloudinary(req.files.audioFile[0], folderPath);
        console.log("Cloudinary Audio Upload Successful:", cloudinaryResult.public_id);
        const folderImagePath =`image/${req.user._id}`
        console.log(`Uploading image to Cloudinary folder: ${folderImagePath}`)
        const cloudinaryImageResult= await uploadImagetoCloudinary(req.files.coverImage[0],folderImagePath)
        console.log("Cloudinary Image Upload Successful:", cloudinaryResult.public_id);
        const assetPayload = {
            public_id: cloudinaryResult.public_id,
            resource_type: cloudinaryResult.resource_type,
            format: cloudinaryResult.format || req.files.audioFile[0].mimetype.split('/')[1],
        };
        const streamPackToken = generateAssetToken(assetPayload);
        console.log("Generated Asset Token (Stream Pack).");
        
        let parseCollaborators=collaborators

        if(typeof collaborators==='string'){
            try{
                parseCollaborators=JSON.parse(collaborators)
            }catch(err){
                console.error("Fail to parse collaborators: ",err)
                parseCollaborators=[]
            }
        }
        const finalCollaborators = [];
        finalCollaborators.push({
            user_id: req.user._id,
            name: req.user.username,
            role: 'Primary Artist'
        });
        console.log(`Added uploader ${req.user.username} as first collaborator.`);

        if (Array.isArray(parseCollaborators)) {
             console.log(`Processing ${parseCollaborators.length} additional collaborators from client.`);
            parseCollaborators.forEach(collab => {
                if (collab && typeof collab.name === 'string' && collab.name.trim()) {
                    const isUploader = collab.user_id &&
                                       mongoose.Types.ObjectId.isValid(collab.user_id) &&
                                       req.user._id.equals(collab.user_id);

                    if (isUploader) {
                        console.log(`Skipping collaborator entry matching uploader: ${collab.name}`);
                        return;
                    }

                    const formattedCollab = {
                        name: collab.name.trim(),
                        role: typeof collab.role === 'string' && collab.role.trim() ? collab.role.trim() : 'Contributor',
                        user_id: (collab.user_id && mongoose.Types.ObjectId.isValid(collab.user_id)) ? collab.user_id : null,
                        artist_id: (collab.artist_id && mongoose.Types.ObjectId.isValid(collab.artist_id)) ? collab.artist_id : null,
                    };
                    finalCollaborators.push(formattedCollab);

                } else {
                    console.warn("Ignoring invalid collaborator object:", collab);
                }
            });
        } else {
            console.log("No additional collaborators array provided by client or invalid format.");
        }
        console.log(`Total collaborators processed: ${finalCollaborators.length}`);

        const musicData = {
            title: title.trim(),
            album_id: album_id && mongoose.Types.ObjectId.isValid(album_id) ? album_id : null,
            genre_id: Array.isArray(genre_id)
                ? genre_id.filter(id => mongoose.Types.ObjectId.isValid(id))
                : [],
            stream_pack: streamPackToken,
            cover_image: cloudinaryImageResult.url,
            duration_ms: durationMs,
            release_date: release_date ? new Date(release_date) : new Date(),
            credits: typeof credits === 'object' && credits !== null ? credits : {},
            collaborators: finalCollaborators,
            play_count: 0,
            like_count: 0,
            comment_count: 0,
            is_deleted: false,
            is_scheduled: false,
            scheduled_release_date: null,
            music_video: {},
        };

        console.log("Saving music metadata to database...");
        const newMusic = await Music.create(musicData);
        console.log("Music record created successfully:", newMusic._id);

        return res.status(201).json({
            message: 'Music uploaded and record created successfully',
            data: {
                _id: newMusic._id,
                title: newMusic.title,
                duration_ms: newMusic.duration_ms,
                primary_artist_name: newMusic.collaborators[0]?.name || 'N/A',
                collaborators: newMusic.collaborators,
                playbackUrl: `/stream/audio/${newMusic._id}`
            }
        });

    } catch (error) {
        if (error instanceof mongoose.Error && error.message.includes('Cannot populate virtual')) {
             console.error('Schema Error: Attempted to populate a virtual without proper definition.', error);
             return res.status(500).json({ message: 'Internal Server Error: Data relationship configuration issue.' });
        }
        console.error('Error during music upload process:', error);

        if (error.name === 'ValidationError') {
             console.error("Mongoose Validation Error:", error.errors);
            return res.status(400).json({ message: 'Validation Error saving music data.', errors: error.errors });
        }
        if (error.code === 11000) {
             console.error("Duplicate key error:", error.keyValue);
             return res.status(409).json({ message: 'Conflict: Potential duplicate record detected.' });
        }
        if (error.message?.includes("Invalid payload")) {
             return res.status(500).json({ message: 'Internal error generating asset token.' });
        }
        return res.status(500).json({
            message: 'Internal server error during music upload.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred.'
        });
    }
};

export const streamMusicById = async (req, res) => {
    const { musicId } = req.params;
    await musicStreamTracking(req.user._id, musicId);
    
    const range = req.headers.range;
    console.log("Streaming music...")
    if (!mongoose.Types.ObjectId.isValid(musicId)) {
        return res.status(400).send('Invalid music identifier format.');
    }

    try {
        console.log(`Streaming requested for musicId: ${musicId} by User: ${req.user?._id || 'Unknown'}, Range: ${range || 'None'}`);
        const musicDoc = await Music.findById(musicId).select('stream_pack is_deleted').lean();
        if (!musicDoc) {
            console.log(`Music not found for streaming: ${musicId}`);
            return res.status(404).send('Music track not found.');
        }
        if (musicDoc.is_deleted) {
             console.log(`Attempt to stream deleted track: ${musicId}`);
            return res.status(404).send('Music track not found or has been removed.');
        }
        if (!musicDoc.stream_pack) {
            console.error(`CRITICAL: Missing stream_pack (asset token) for musicId: ${musicId}`);
            return res.status(500).send('Internal server error: Asset information is missing.');
        }
        let assetDetails;
        try {
            assetDetails = verifyAssetToken(musicDoc.stream_pack);
             console.log(`Decoded asset token for ${musicId}: public_id=${assetDetails.public_id}`);
        } catch (jwtError) {
            console.error(`Failed to verify asset token for musicId ${musicId}:`, jwtError);
            return res.status(403).send('Forbidden: Invalid or expired asset token.');
        }

        const { public_id, resource_type, format } = assetDetails;
        if (!public_id || !resource_type) {
            console.error(`Incomplete asset details in token for musicId: ${musicId}. Token payload:`, assetDetails);
            return res.status(500).send('Internal server error: Incomplete asset information in token.');
        }

        const cloudinaryUrl = cloudinary.v2.url(public_id, {
            resource_type: resource_type,
            secure: true,
        });
        console.log(`Proxying request to Cloudinary URL: ${cloudinaryUrl}`);

        const options = {
             method: 'GET',
             headers: {
                'User-Agent': req.headers['user-agent'] || 'NodeJS-Proxy-Streamer',
             }
        };
        if (range) {
            options.headers['Range'] = range;
            console.log(`Forwarding Range header: ${range} for ${musicId}`);
        }
        const cloudinaryRequest = https.request(cloudinaryUrl, options, async (cloudinaryResponse) => {
            const { statusCode, headers: responseHeaders } = cloudinaryResponse;
            console.log(`Cloudinary response status: ${statusCode} for ${public_id}`);

            if (res.destroyed) {
                 console.log(`Client connection closed before Cloudinary response for ${musicId}. Aborting.`);
                 cloudinaryResponse.destroy();
                 return;
            }

            if (statusCode < 200 || statusCode >= 300) {
                console.error(`Error from Cloudinary for ${public_id}: Status ${statusCode}`);
                cloudinaryResponse.resume();
                if(res.headersSent) {
                     console.warn(`Headers already sent for ${musicId}, but received error ${statusCode} from Cloudinary.`);
                    return;
                }

                if (statusCode === 404) return res.status(404).send('Audio source file not found on CDN.');
                if (statusCode === 403) return res.status(403).send('Forbidden accessing audio source on CDN.');
                if (statusCode === 416) return res.status(416).send('Range not satisfiable.');
                return res.status(502).send(`Bad Gateway: Upstream server error (${statusCode})`);
            }
            if(res.headersSent) {
                console.warn(`Headers already sent for ${musicId}, but received success ${statusCode} from Cloudinary. Aborting pipe.`);
                cloudinaryResponse.resume();
                return;
            }

            const contentType = responseHeaders['content-type'] || `audio/${format || 'mpeg'}`;
            res.setHeader('Content-Type', contentType);
            if (responseHeaders['content-length']) res.setHeader('Content-Length', responseHeaders['content-length']);
            if (responseHeaders['accept-ranges']) res.setHeader('Accept-Ranges', responseHeaders['accept-ranges']);
            if (responseHeaders['content-range']) res.setHeader('Content-Range', responseHeaders['content-range']);

            res.writeHead(statusCode);
            console.log(`Piping stream for ${musicId} (${public_id}) to client... Status: ${statusCode}`);
            try {
                await pipeline(cloudinaryResponse, res);
                console.log(`Stream finished successfully for ${musicId} (${public_id}).`);
            } catch (pipeError) {
                console.error(`Stream piping error for ${musicId} (${public_id}):`, pipeError.code || pipeError.message);
                 if (!res.writableEnded) {
                    res.end();
                 }
                 if (!cloudinaryResponse.destroyed) {
                     cloudinaryResponse.destroy();
                 }
            }
        });

        cloudinaryRequest.on('error', (error) => {
            console.error(`HTTPS request error to Cloudinary for ${public_id}:`, error);
             if (!res.headersSent && !res.destroyed) {
                res.status(502).send('Bad Gateway: Failed to connect to audio source.');
            }
        });

        req.on('close', () => {
            console.log(`Client closed connection for musicId: ${musicId}`);
             if (!cloudinaryRequest.destroyed) {
                console.log(`Destroying Cloudinary request for ${musicId} due to client disconnect.`);
                cloudinaryRequest.destroy();
             }
        });

        cloudinaryRequest.end();

    } catch (error) {
        console.error(`Unexpected error in stream controller for musicId ${musicId}:`, error);
        if (!res.headersSent && !res.destroyed) {
             if (error.name === 'CastError') {
                return res.status(400).send('Invalid music identifier format.');
            }
            res.status(500).send('Internal server error during stream setup.');
        }
    }
};

export const getMusicById = async (req, res) => {
    const { id } = req.params;
    console.log("Getting music by id...")

     if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid music identifier format.' });
    }
    try {
        const music = await Music.findById(id).lean();

        if (!music || music.is_deleted) {
            return res.status(404).json({ message: 'Music not found.' });
        }

        const responseData = {
            _id: music._id,
            title: music.title,
            duration_ms: music.duration_ms,
            primary_artist_name: music.collaborators[0]?.name || 'N/A',
            collaborators: music.collaborators,
            like_count: music.like_count,
            created_at: music.createdAt,
            updated_at: music.updatedAt,
            play_count: music.play_count,
            genre_id: music.genre_id,
            album_id: music.album_id,
            credits: music.credits,
            release_date: music.release_date,
            playbackUrl: `/stream/audio/${music._id}`
        };

        return res.status(200).json({
            message: 'Music detail retrieved successfully',
            data: responseData
        });
    } catch (error) {
        console.error(`Error fetching music ${id}:`, error);
        if (error.name === 'CastError') {
             return res.status(400).json({ message: 'Invalid music identifier format.' });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const updateMusic = async (req, res) => {
    const { id } = req.params;
    const { title, collaborators, album_id, genre_id, release_date, credits } = req.body;
    console.log("Updating music...")
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid music identifier format.' });
    }
    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: 'Unauthorized: User information missing.' });
    }

    try {
        const music = await Music.findById(id);

        if (!music) {
            return res.status(404).json({ message: 'Music track not found.' });
        }
        if (music.is_deleted) {
            return res.status(404).json({ message: 'Cannot update a deleted music track.' });
        }

        if (!music.collaborators || music.collaborators.length === 0 || !music.collaborators[0].user_id) {
             console.warn(`Music track ${id} has missing primary collaborator user_id for authorization check.`);
             return res.status(500).json({ message: 'Cannot determine owner for update authorization.' });
        }
        if (!music.collaborators[0].user_id.equals(req.user._id) /* && !req.user.isAdmin */) {
            console.warn(`User ${req.user._id} attempted to update music ${id} owned by ${music.collaborators[0].user_id}`);
            return res.status(403).json({ message: 'Forbidden: You do not have permission to update this track.' });
        }

        const updateData = {};
        if (title && typeof title === 'string') updateData.title = title.trim();
        if (release_date) {
            const parsedDate = new Date(release_date);
            if (!isNaN(parsedDate)) updateData.release_date = parsedDate;
        }
        if (typeof credits === 'object') updateData.credits = credits;
        if (album_id !== undefined) {
             updateData.album_id = album_id && mongoose.Types.ObjectId.isValid(album_id) ? album_id : null;
        }
        if (Array.isArray(genre_id)) {
            updateData.genre_id = genre_id.filter(gid => mongoose.Types.ObjectId.isValid(gid));
        }
        if (Array.isArray(collaborators)) {
             const updatedCollaborators = [];
            let primaryFound = false;
             collaborators.forEach(collab => {
                 if (collab && typeof collab.name === 'string' && collab.name.trim()) {
                     const formattedCollab = {
                         name: collab.name.trim(),
                         role: typeof collab.role === 'string' && collab.role.trim() ? collab.role.trim() : 'Contributor',
                         user_id: (collab.user_id && mongoose.Types.ObjectId.isValid(collab.user_id)) ? collab.user_id : null,
                         artist_id: (collab.artist_id && mongoose.Types.ObjectId.isValid(collab.artist_id)) ? collab.artist_id : null,
                     };
                     if (formattedCollab.user_id && toString(formattedCollab.user_id) === toString(req.user._id)) {
                          formattedCollab.role = 'Primary Artist';
                          primaryFound = true;
                     }
                     updatedCollaborators.push(formattedCollab);
                 } else {
                     console.warn("Ignoring invalid collaborator object during update:", collab);
                 }
             });
             if (!primaryFound) {
                 console.warn(`Uploader ${req.user.username} (${req.user._id}) was not found in the submitted collaborator list during update. Re-adding as Primary Artist.`);
                 updatedCollaborators.unshift({
                     user_id: req.user._id,
                     name: req.user.username,
                     role: 'Primary Artist'
                 });
             }
             if (updatedCollaborators.length > 0) {
                 updateData.collaborators = updatedCollaborators;
             }
        }
         if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided for update.' });
        }

        console.log(`Updating music track ${id} by user ${req.user._id} with data:`, updateData);
        const updatedMusic = await Music.findByIdAndUpdate(id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedMusic) {
             return res.status(404).json({ message: 'Music track not found during update operation.' });
        }

        console.log(`Music track ${id} updated successfully.`);
        const responseData = {
            _id: updatedMusic._id,
            title: updatedMusic.title,
            duration_ms: updatedMusic.duration_ms,
            primary_artist_name: updatedMusic.collaborators[0]?.name || 'N/A',
            collaborators: updatedMusic.collaborators,
            like_count: updatedMusic.like_count,
            created_at: updatedMusic.createdAt,
            updated_at: updatedMusic.updatedAt,
            play_count: updatedMusic.play_count,
            genre_id: updatedMusic.genre_id,
            album_id: updatedMusic.album_id,
            credits: updatedMusic.credits,
            release_date: updatedMusic.release_date,
            playbackUrl: `/stream/audio/${updatedMusic._id}`
        };

        return res.status(200).json({
            message: 'Music metadata updated successfully',
            data: responseData
        });

    } catch (error) {
        console.error(`Error updating music ${id}:`, error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error updating music data.', errors: error.errors });
        }
         if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid data format provided for update (e.g., invalid ID).', field: error.path });
        }
        return res.status(500).json({ message: 'Internal Server Error during music update.' });
    }
};

export const deleteMusic = async (req, res) => {
    const { id } = req.params;
    console.log("Deleting music...")
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid music identifier format.' });
    }
    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: 'Unauthorized: User information missing.' });
    }

    try {
        const music = await Music.findById(id).select('is_deleted collaborators');

        if (!music) {
            return res.status(404).json({ message: 'Music track not found.' });
        }
        if (music.is_deleted) {
            console.log(`Music track ${id} is already marked as deleted.`);
            return res.status(200).json({ message: 'Music track was already deleted.' });
        }

         if (!music.collaborators || music.collaborators.length === 0 || !music.collaborators[0].user_id) {
             console.warn(`Music track ${id} has missing primary collaborator user_id for delete authorization check.`);
             return res.status(500).json({ message: 'Cannot determine owner for delete authorization.' });
         }
        const isOwner = music.collaborators[0].user_id.equals(req.user._id);
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            console.warn(`User ${req.user._id} (role: ${req.user.role}) attempted to delete music ${id} owned by ${music.collaborators[0].user_id}`);
            return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this track.' });
        }

        console.log(`Soft deleting music track ${id} by user ${req.user._id} (IsAdmin: ${isAdmin})`);
        const updateResult = await Music.updateOne(
            { _id: id },
            { $set: { is_deleted: true } }
        );

        if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 1) {
             console.log(`Music track ${id} was likely already deleted before the update operation completed.`);
             return res.status(200).json({ message: 'Music track was already deleted.' });
        } else if (updateResult.matchedCount === 0) {
             console.error(`Failed to find music track ${id} during the delete (updateOne) operation.`);
             return res.status(404).json({ message: 'Music track not found during delete operation.' });
        }

        console.log(`Music track ${id} marked as deleted successfully.`);
        return res.status(204).send();

    } catch (error) {
        console.error(`Error deleting music ${id}:`, error);
         if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid music identifier format.' });
        }
        return res.status(500).json({ message: 'Internal Server Error during music deletion.' });
    }
};

export const musicStreamTracking = async (userID = "", musicID = "") => {
    if (!userID || !musicID || !mongoose.Types.ObjectId.isValid(userID) || !mongoose.Types.ObjectId.isValid(musicID)) {
        console.error(`Invalid UserID (${userID}) or MusicID (${musicID}) provided for stream tracking.`);
        return false;
    }
    console.log("Trying to update/create tracking record...");
    try {
        const updatedRecord = await StreamTracking.findOneAndUpdate(
            { user_id: new mongoose.Types.ObjectId(userID), music_id: new mongoose.Types.ObjectId(musicID) },
            { $inc: { play_count: 1 }, $set: { last_played_at: Date.now() } },
            { upsert: true, new: true, setDefaultsOnInsert: true } // Ensure defaults like play_count:1 on insert
        );

        if (updatedRecord) {
            console.log(`Stream tracked/updated: User ${userID} -> Music ${musicID} (Play Count: ${updatedRecord.play_count}, Record ID: ${updatedRecord._id})`);
            // Increment global play_count on Music model
            await Music.findByIdAndUpdate(musicID, { $inc: { play_count: 1 } });
            return true;
        } else {
            console.warn(`StreamTracking.findOneAndUpdate failed to return a record for User ${userID}, Music ${musicID}`);
            return false;
        }
    } catch (e) {
        console.error(`Error updating/creating stream tracking record for User ${userID} -> Music ${musicID}:`, e.message);
        if (e.code === 11000) { // Handle rare race condition if upsert fails due to concurrent insert
             console.warn("Race condition during stream tracking upsert, attempting retry or log.");
        }
        return false;
    }
};

export const searchMusic = async (req, res, next) => {
    const {
        q,
        type = 'all', // Default to searching all types
        genreId,
        albumId: queryAlbumId, // Renamed to avoid conflict with album results
        artistId: queryArtistId, // Renamed
        limit = 10, // Default overall limit if specific limits aren't set
        page = 1,   // Default overall page
        musicPage = 1, albumPage = 1, artistPage = 1,
        musicLimit = 5, albumLimit = 5, artistLimit = 5 // Default limits per category
    } = req.query;

    const currentUser = req.user; // For potential personalization in the future

    try {
        const results = {
            music: { data: [], pagination: {} },
            albums: { data: [], pagination: {} },
            artists: { data: [], pagination: {} },
        };

        const globalFilter = { is_deleted: false };
        const keywordRegex = q ? { $regex: q.trim(), $options: 'i' } : null;

        // --- Music Search ---
        if (type === 'all' || type === 'music') {
            const musicFilter = { ...globalFilter };
            const musicConditions = [];

            if (keywordRegex) {
                musicConditions.push({
                    $or: [
                        { title: keywordRegex },
                        { 'collaborators.name': keywordRegex }
                    ]
                });
            }
            if (genreId) musicConditions.push({ genre_id: new mongoose.Types.ObjectId(genreId) });
            if (queryAlbumId) musicConditions.push({ album_id: new mongoose.Types.ObjectId(queryAlbumId) });
            if (queryArtistId) musicConditions.push({ 'collaborators.artist_id': new mongoose.Types.ObjectId(queryArtistId) }); // Or user_id if artists are users

            if (musicConditions.length > 0) {
                musicFilter.$and = musicConditions;
            }

            const mLimit = parseInt(musicLimit) || parseInt(limit);
            const mPage = parseInt(musicPage) || parseInt(page);
            const mSkip = (mPage - 1) * mLimit;

            const musicList = await Music.find(musicFilter)
                .sort({ play_count: -1, createdAt: -1 })
                .skip(mSkip)
                .limit(mLimit)
                .select('-stream_pack -is_deleted') // Exclude sensitive info
                .populate({ path: 'album_id', select: 'name cover_image_path' }) // Populate basic album info
                .lean();

            const totalMusic = await Music.countDocuments(musicFilter);
            results.music = {
                data: musicList.map(m => ({ ...m, playbackUrl: `/api/v1/music/stream/${m._id}`})),
                pagination: {
                    page: mPage,
                    limit: mLimit,
                    totalPages: Math.ceil(totalMusic / mLimit),
                    totalItems: totalMusic
                }
            };
        }

        // --- Album Search ---
        if (type === 'all' || type === 'album') {
            const albumFilter = { ...globalFilter };
             const albumConditions = [];
            if (keywordRegex) {
                 albumConditions.push({
                     $or: [
                         { name: keywordRegex },
                         { 'collaborators.name': keywordRegex }
                     ]
                 });
            }
            if (genreId) albumConditions.push({ genre_id: new mongoose.Types.ObjectId(genreId) });
            // If searching for albums by a specific artist
            if (queryArtistId) albumConditions.push({ 'collaborators.artist_id': new mongoose.Types.ObjectId(queryArtistId) });


            if(albumConditions.length > 0) {
                albumFilter.$and = albumConditions;
            }

            const aLimit = parseInt(albumLimit) || parseInt(limit);
            const aPage = parseInt(albumPage) || parseInt(page);
            const aSkip = (aPage - 1) * aLimit;

            const albumList = await Album.find(albumFilter)
                .sort({ release_date: -1, createdAt: -1 })
                .skip(aSkip)
                .limit(aLimit)
                .select('-credits -is_deleted')
                .populate({path: 'genre_id', select: 'name'}) // Populate genre name
                .lean();
            const totalAlbums = await Album.countDocuments(albumFilter);
            results.albums = {
                data: albumList,
                pagination: {
                    page: aPage,
                    limit: aLimit,
                    totalPages: Math.ceil(totalAlbums / aLimit),
                    totalItems: totalAlbums
                }
            };
        }

        // --- Artist Search ---
        if (type === 'all' || type === 'artist') {
            const artistFilter = { ...globalFilter };
            if (keywordRegex) artistFilter.name = keywordRegex;
            // If searching artists by a specific genre
            if (genreId) artistFilter.genres = new mongoose.Types.ObjectId(genreId);


            const artLimit = parseInt(artistLimit) || parseInt(limit);
            const artPage = parseInt(artistPage) || parseInt(page);
            const artSkip = (artPage - 1) * artLimit;

            const artistList = await Artist.find(artistFilter)
                .sort({ name: 1 }) // Typically sort artists by name
                .skip(artSkip)
                .limit(artLimit)
                .select('-is_deleted')
                .lean();
            const totalArtists = await Artist.countDocuments(artistFilter);
            results.artists = {
                data: artistList,
                pagination: {
                    page: artPage,
                    limit: artLimit,
                    totalPages: Math.ceil(totalArtists / artLimit),
                    totalItems: totalArtists
                }
            };
        }

        sendSuccess(res, 200, results, 'Search results retrieved successfully.');

    } catch (error) {
        if (error.name === 'CastError') {
            return sendError(res, 400, 'Invalid ID format provided for filtering.');
        }
        next(error);
    }
};

export const listNewMusic = async (req, res) => {
    const { limit = 12 } = req.query;
    console.log(`Listing new music requested by user: ${req.user?.username || 'Unknown'}`);
    try {
        const limitNum = parseInt(limit, 10);
        if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
            return res.status(400).json({ message: 'Invalid limit parameter. Must be a positive number (max 100).' });
        }

        console.log(`Fetching ${limitNum} newest music tracks.`);

        const newMusic = await Music.find({ is_deleted: false })
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .lean();

        const formattedResults = newMusic.map(music => ({
            _id: music._id,
            cover_image: music.cover_image,
            title: music.title,
            duration_ms: music.duration_ms,
            primary_artist_name: music.collaborators[0]?.name || 'N/A',
            like_count: music.like_count,
            play_count: music.play_count,
            created_at: music.createdAt,
            playbackUrl: `/api/v1/music/stream/${music._id}`
        }));

        return res.status(200).json({
            message: 'Newest music tracks retrieved successfully',
            data: formattedResults
        });

    } catch (error) {
        console.error('Error fetching new music:', error);
        return res.status(500).json({ message: 'Internal Server Error fetching new music.' });
    }
};

export const listArtistMusic=async (req,res)=>{
    try{
        const {limit=10,offset=0,sortBy,sortOrder}=req.params
        const user_id=req.user
        const limitNum=parseInt(limit,10)
        const offsetNum = parseInt(offset, 10);
        if (isNaN(limitNum) || limitNum <= 0 || limitNum > 30) {
            return res.status(400).json({ message: 'Invalid limit parameter. Must be a positive number (max 30).' });
        }
        if (isNaN(offsetNum) || offsetNum < 0) {
            return res.status(400).json({ message: 'Invalid offset parameter. Must be a non-negative number.' });
        }
        console.log(`Fetching ${limitNum} newest music tracks.`);
        const ArtistMusic = await Music.find({ is_deleted: false ,"collaborators.0.user_id": user_id._id})
        .sort({ createdAt: -1 })
        .skip(offsetNum)
        .limit(limitNum)
        .lean();
        const formattedResults = ArtistMusic.map(music => ({
            _id: music._id,
            cover_image: music.cover_image,
            title: music.title,
            genre: Array.isArray(music.genre) ? music.genre : [],
            collaborators: Array.isArray(music.collaborators) ? music.collaborators : [],
            content_type:(music.content_type && music.content_type.stream_pack) ? 'Music' : 'Poscast',
            created_at: music.createdAt,
        }));
        return res.status(200).json({
            message: 'List Music successfully',
            data: formattedResults
        });
    }catch(err){
        console.error('Error fetching user music:', error);
        return res.status(500).json({ message: 'Internal Server Error User new music.' });
    }
}