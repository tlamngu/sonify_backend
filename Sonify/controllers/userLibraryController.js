// In: ../controllers/userLibraryController.js
import mongoose from 'mongoose';
import UserLibraryItem from '../models/userLibraryItem.model.js';
import Music from '../models/music.model.js';
import Album from '../models/album.model.js';
import Playlist from '../models/playlist.model.js';
import Artist from '../models/artist.model.js';
import { sendSuccess, sendError } from '../utils/responseUtils.js';

const itemModelMap = {
    music: Music,
    album: Album,
    playlist: Playlist,
    artist: Artist,
};

// Helper function to check if an item exists
async function validateItemExists(itemId, itemType) {
    const Model = itemModelMap[itemType];
    if (!Model) {
        return { exists: false, message: 'Invalid item type specified for validation.' };
    }
    const item = await Model.findOne({ _id: itemId, is_deleted: { $ne: true } }); // Check for not deleted
    return { exists: !!item, message: item ? null : `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found or has been removed.` };
}


export const addItemToLibrary = async (req, res, next) => {
    const { item_id, item_type } = req.body;
    const user_id = req.user._id;

    try {
        const itemValidation = await validateItemExists(item_id, item_type);
        if (!itemValidation.exists) {
            return sendError(res, 404, itemValidation.message || 'Item not found.');
        }

        const existingLibraryItem = await UserLibraryItem.findOne({ user_id, item_id, item_type });

        if (existingLibraryItem) {
            return sendSuccess(res, 200, existingLibraryItem, 'Item already in library.');
        }

        const newLibraryItem = new UserLibraryItem({
            user_id,
            item_id,
            item_type,
        });
        await newLibraryItem.save();

        sendSuccess(res, 201, newLibraryItem, 'Item added to library successfully.');
    } catch (error) {
        if (error.code === 11000) {
            return sendSuccess(res, 200, null, 'Item already in library (concurrent add).');
        }
        next(error);
    }
};

export const removeItemFromLibrary = async (req, res, next) => {
    const { item_id, item_type } = req.body; // Or use params if you prefer /library/items/:itemId?type=music
    const user_id = req.user._id;

    try {
        const result = await UserLibraryItem.deleteOne({ user_id, item_id, item_type });

        if (result.deletedCount === 0) {
            return sendError(res, 404, 'Item not found in library.');
        }

        sendSuccess(res, 200, null, 'Item removed from library successfully.');
    } catch (error) {
        next(error);
    }
};

export const listLibraryItems = async (req, res, next) => {
    const user_id = req.user._id;
    const { item_type, page = 1, limit = 10, sortBy = 'added_date', sortOrder = 'desc' } = req.query;

    try {
        const filter = { user_id };
        if (item_type) {
            if (!Object.keys(itemModelMap).includes(item_type)) {
                return sendError(res, 400, 'Invalid item_type filter.');
            }
            filter.item_type = item_type;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const libraryItems = await UserLibraryItem.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean(); // Use lean for performance if not modifying

        const totalItems = await UserLibraryItem.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / parseInt(limit));

        // Optionally, populate the actual items
        const populatedItems = await Promise.all(
            libraryItems.map(async (libItem) => {
                const Model = itemModelMap[libItem.item_type];
                if (Model) {
                    const itemDetails = await Model.findById(libItem.item_id)
                                                   .select(libItem.item_type === 'music' ? '-stream_pack' : '') // Example specific field exclusion
                                                   .lean();
                    return { ...libItem, details: itemDetails };
                }
                return libItem;
            })
        );

        sendSuccess(res, 200, {
            items: populatedItems,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages,
                totalItems,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1,
            },
            filters: { item_type }
        }, 'Library items retrieved successfully.');
    } catch (error) {
        next(error);
    }
};