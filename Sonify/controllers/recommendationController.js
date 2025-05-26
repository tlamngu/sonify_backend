// In: ../controllers/recommendationController.js
import mongoose from 'mongoose';
import StreamTracking from '../models/streamTracking.model.js';
import UserLikedItem from '../models/userLikedItem.model.js';
import UserLibraryItem from '../models/userLibraryItem.model.js';
import Music from '../models/music.model.js';
import Genre from '../models/genre.model.js';
import { sendSuccess, sendError } from '../utils/responseUtils.js';

async function getInteractedMusicIds(userId) {
    const interactedIds = new Set();
    const libraryMusic = await UserLibraryItem.find({ user_id: userId, item_type: 'music' }).select('item_id').lean();
    libraryMusic.forEach(item => interactedIds.add(item.item_id.toString()));
    const likedMusic = await UserLikedItem.find({ user_id: userId, item_type: 'music' }).select('item_id').lean();
    likedMusic.forEach(item => interactedIds.add(item.item_id.toString()));
    const streamedMusic = await StreamTracking.find({ user_id: userId /* , play_count: { $gte: 2 } */ }).select('music_id').lean();
    streamedMusic.forEach(item => interactedIds.add(item.music_id.toString()));
    return Array.from(interactedIds).map(id => new mongoose.Types.ObjectId(id));
}


export const getMusicRecommendations = async (req, res, next) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; 

    try {
        const genreScores = {};
        const streamedMusicWithGenre = await StreamTracking.aggregate([
            { $match: { user_id: userId } },
            {
                $lookup: {
                    from: 'musics',
                    localField: 'music_id',
                    foreignField: '_id',
                    as: 'musicDetails'
                }
            },
            { $unwind: '$musicDetails' },
            { $unwind: '$musicDetails.genre_id' }, 
            {
                $group: {
                    _id: '$musicDetails.genre_id',
                    totalPlays: { $sum: '$play_count' }
                }
            }
        ]);

        streamedMusicWithGenre.forEach(item => {
            const genreIdStr = item._id.toString();
            genreScores[genreIdStr] = (genreScores[genreIdStr] || 0) + (item.totalPlays * 1.0);
        });

        const likedMusicItems = await UserLikedItem.find({ user_id: userId, item_type: 'music' })
            .populate({
                path: 'item_id',
                model: 'Music',
                select: 'genre_id'
            })
            .lean();

        likedMusicItems.forEach(like => {
            if (like.item_id && like.item_id.genre_id) {
                const genres = Array.isArray(like.item_id.genre_id) ? like.item_id.genre_id : [like.item_id.genre_id];
                genres.forEach(genreId => {
                    if (genreId) {
                        const genreIdStr = genreId.toString();
                        genreScores[genreIdStr] = (genreScores[genreIdStr] || 0) + 1.5; 
                    }
                });
            }
        });

        if (Object.keys(genreScores).length === 0) {
            const fallbackMusic = await Music.find({ is_deleted: false })
                .sort({ play_count: -1, createdAt: -1 })
                .limit(limit)
                .select('-stream_pack -is_deleted')
                .lean();
             return sendSuccess(res, 200, {
                recommendations: fallbackMusic.map(m => ({ ...m, playbackUrl: `/api/v1/music/stream/${m._id}`})),
                pagination: { page: 1, limit, totalPages: 1, totalItems: fallbackMusic.length, source: 'fallback_popular' }
            }, 'Recommendations generated (fallback).');
        }

        const sortedGenres = Object.entries(genreScores)
            .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
            .map(([genreId]) => new mongoose.Types.ObjectId(genreId));

        const interactedMusicObjectIds = await getInteractedMusicIds(userId);

        const skip = (page - 1) * limit;
        const recommendedMusicQuery = {
            is_deleted: false,
            genre_id: { $in: sortedGenres.slice(0, 5) }, 
            _id: { $nin: interactedMusicObjectIds }
        };
        
        let recommendations = await Music.find(recommendedMusicQuery)
            .populate({ path: 'album_id', select: 'name cover_image_path' })
            .select('-stream_pack -is_deleted')
            .lean();

        recommendations.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;

            const aGenres = Array.isArray(a.genre_id) ? a.genre_id : [a.genre_id];
            aGenres.forEach(gid => {
                scoreA = Math.max(scoreA, genreScores[gid.toString()] || 0);
            });

            const bGenres = Array.isArray(b.genre_id) ? b.genre_id : [b.genre_id];
            bGenres.forEach(gid => {
                scoreB = Math.max(scoreB, genreScores[gid.toString()] || 0);
            });
            
            if (scoreB !== scoreA) return scoreB - scoreA; 
            return (b.play_count || 0) - (a.play_count || 0); 
        });
        
        const paginatedRecommendations = recommendations.slice(skip, skip + limit);
        const totalRecommended = recommendations.length;
        const totalPages = Math.ceil(totalRecommended / limit);


        sendSuccess(res, 200, {
            recommendations: paginatedRecommendations.map(m => ({ ...m, playbackUrl: `/api/v1/music/stream/${m._id}`})),
            pagination: {
                page,
                limit,
                totalPages,
                totalItems: totalRecommended,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                source: 'genre_preference'
            },
        }, 'Music recommendations generated successfully.');

    } catch (error) {
        next(error);
    }
};