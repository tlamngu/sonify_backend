// In: ../controllers/albumController.js
import mongoose from 'mongoose';
import Album from '../models/album.model.js';
import Music from '../models/music.model.js';
import { sendSuccess, sendError } from '../utils/responseUtils.js';

export const listMusicInAlbum = async (req, res, next) => {
    const { albumId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!mongoose.Types.ObjectId.isValid(albumId)) {
        return sendError(res, 400, 'Invalid Album ID format.');
    }

    try {
        const album = await Album.findById(albumId);
        if (!album || album.is_deleted) {
            return sendError(res, 404, 'Album not found or has been deleted.');
        }

        const skip = (page - 1) * limit;

        const musicQuery = { album_id: albumId, is_deleted: false };

        const albumMusic = await Music.find(musicQuery)
            .sort({ release_date: 1, createdAt: 1 }) // Or track order if available
            .skip(skip)
            .limit(limit)
            .select('-stream_pack -credits -is_deleted') // Exclude sensitive or unnecessary fields
            .lean();

        const totalMusicInAlbum = await Music.countDocuments(musicQuery);
        const totalPages = Math.ceil(totalMusicInAlbum / limit);

        // Optionally enrich music with playback URLs if not done by a virtual or transform
        const formattedMusic = albumMusic.map(m => ({
            ...m,
            playbackUrl: `/api/v1/music/stream/${m._id}` // Assuming this structure
        }));


        sendSuccess(res, 200, {
            album: {
                _id: album._id,
                name: album.name,
                cover_image_path: album.cover_image_path,
            },
            music: formattedMusic,
            pagination: {
                page,
                limit,
                totalPages,
                totalItems: totalMusicInAlbum,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            }
        }, 'Music in album retrieved successfully.');

    } catch (error) {
        next(error);
    }
};