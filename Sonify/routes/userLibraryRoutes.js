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

router.delete(
    '/items',
    protect,
    libraryItemValidation, 
    validateRequest,
    removeItemFromLibrary
);


// GET /api/v1/library/items - List items in user's library
router.get(
    '/items',
    protect,
    query('item_type').optional().isString().isIn(['music', 'album', 'playlist', 'artist']).withMessage('Invalid item_type filter.'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    validateRequest,
    listLibraryItems
);

export default router;