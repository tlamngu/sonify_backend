// In: ../validators/userFeaturesValidators.js
import { body } from 'express-validator';
import mongoose from 'mongoose';

const VALID_LIKE_ITEM_TYPES = ['music', 'album', 'playlist', 'artist', 'podcast', 'episode', 'comment']; // As per UserLikedItem model

export const toggleLikeValidation = [
    body('item_id')
        .notEmpty().withMessage('Item ID is required.')
        .custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid Item ID format.'),
    body('item_type')
        .notEmpty().withMessage('Item type is required.')
        .isIn(VALID_LIKE_ITEM_TYPES).withMessage(`Invalid item type. Must be one of: ${VALID_LIKE_ITEM_TYPES.join(', ')}`)
];