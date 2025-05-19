import mongoose from 'mongoose';
import Music from '../models/music.model.js';
import Album from '../models/album.model.js';
import Playlist from '../models/playlist.model.js';
import Artist from '../models/artist.model.js';

export const itemModelMap = {
    music: Music,
    album: Album,
    playlist: Playlist,
    artist: Artist,
    // podcast: Podcast,
    // episode: Episode,
    // comment: Comment,
};

export const updateLikeCount = async (itemId, itemType, increment) => {
    const Model = itemModelMap[itemType];

    if (!Model) {
        console.warn(`Like count update skipped: Model not found for item_type "${itemType}".`);
        return;
    }
    if (!Model.schema.paths['like_count']) {
        console.warn(`Like count update skipped: 'like_count' field not found in schema for item_type "${itemType}".`);
        return;
    }

    try {
        const updateValue = increment ? 1 : -1;
        const result = await Model.findByIdAndUpdate(itemId, { $inc: { like_count: updateValue } }, { new: true });

        if (result) {
            console.log(`Like count for ${itemType} ${itemId} updated by ${updateValue}. New count: ${result.like_count}`);
        } else {
            console.warn(`Like count update failed: ${itemType} ${itemId} not found during update.`);
        }
    } catch (error) {
        console.error(`Error updating like count for ${itemType} ${itemId}:`, error);
    }
};

export async function validateItemExists(itemId, itemType) {
    const Model = itemModelMap[itemType];

    if (!Model) {
        return { exists: false, message: `Invalid item type "${itemType}" specified for validation.` };
    }

    try {
        const queryConditions = { _id: itemId };
        if (Model.schema.paths['is_deleted']) {
            queryConditions.is_deleted = { $ne: true };
        }

        const item = await Model.findOne(queryConditions).lean();

        if (item) {
            return { exists: true, item: item, message: null };
        } else {
            const itemTypeName = itemType.charAt(0).toUpperCase() + itemType.slice(1);
            return { exists: false, message: `${itemTypeName} not found or has been removed.` };
        }
    } catch (error) {
        if (error.name === 'CastError') {
             const itemTypeName = itemType.charAt(0).toUpperCase() + itemType.slice(1);
            return { exists: false, message: `Invalid ID format for ${itemTypeName}.` };
        }
        console.error(`Error validating item existence for ${itemType} ${itemId}:`, error);
        return { exists: false, message: 'An internal error occurred while validating the item.' };
    }
}