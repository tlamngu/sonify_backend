// In: ../utils/likeUtils.js
import Music from '../models/music.model.js';
import Album from '../models/album.model.js';
import Playlist from '../models/playlist.model.js';
// Add other models like Artist, Podcast, Episode, Comment if they have a like_count field

const likeableModels = {
    music: Music,
    album: Album,
    playlist: Playlist,
    // artist: Artist, // If artists can be liked and have a like_count
};

export const updateLikeCount = async (itemId, itemType, increment) => {
    const Model = likeableModels[itemType];
    if (!Model || !Model.schema.paths['like_count']) { // Check if model exists and has like_count
        console.warn(`Like count update skipped: Model or like_count field not found for item_type "${itemType}".`);
        return;
    }

    try {
        const updateValue = increment ? 1 : -1;
        await Model.findByIdAndUpdate(itemId, { $inc: { like_count: updateValue } });
        console.log(`Like count for ${itemType} ${itemId} updated by ${updateValue}.`);
    } catch (error) {
        console.error(`Error updating like count for ${itemType} ${itemId}:`, error);
        // Decide if this error should propagate or just be logged
    }
};