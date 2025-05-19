// In: ../routes/userLibraryRoutes.js
import express from 'express';
import {
    addItemToLibrary,
    removeItemFromLibrary,
    listLibraryItems
} from '../controllers/userLibraryController.js';
import { libraryItemValidation, libraryItemIdParamValidation } from '../validators/userLibraryValidators.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { protect } from '../middlewares/authMiddleware.js';
import { query } from 'express-validator'; // For query validation

const router = express.Router();

// POST /api/v1/library/items - Add an item to user's library
router.post(
    '/items',
    protect,
    libraryItemValidation,
    validateRequest,
    addItemToLibrary
);

// DELETE /api/v1/library/items - Remove an item from user's library (using body for item_id, item_type)
// Alternatively, you could use DELETE /api/v1/library/items/:item_id?type=music
router.delete(
    '/items', // If using body for item_id and item_type
    protect,
    libraryItemValidation, // Can reuse the same validation as adding
    validateRequest,
    removeItemFromLibrary
);
/*
// Example of DELETE with params if preferred:
router.delete(
    '/items/:itemId',
    protect,
    libraryItemIdParamValidation, // Validates itemId in path
    query('item_type').notEmpty().withMessage('Item type query parameter is required.'), // Validates item_type in query
    validateRequest,
    (req, res, next) => { // Adapt controller to take itemId from params and item_type from query
        req.body.item_id = req.params.itemId;
        req.body.item_type = req.query.item_type;
        removeItemFromLibrary(req, res, next);
    }
);
*/


// GET /api/v1/library/items - List items in user's library
router.get(
    '/items',
    protect,
    // Optional: Add query validators for pagination, item_type filter
    query('item_type').optional().isString().isIn(['music', 'album', 'playlist', 'artist']).withMessage('Invalid item_type filter.'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    validateRequest,
    listLibraryItems
);

export default router;