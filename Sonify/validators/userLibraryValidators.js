// In: ../validators/userLibraryValidators.js
import { body, param } from 'express-validator';
import mongoose from 'mongoose';

const VALID_ITEM_TYPES = ['music', 'album', 'playlist', 'artist'];

export const libraryItemValidation = [
    body('item_id')
        .notEmpty().withMessage('Item ID is required.')
        .custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid Item ID format.'),
    body('item_type')
        .notEmpty().withMessage('Item type is required.')
        .isIn(VALID_ITEM_TYPES).withMessage(`Invalid item type. Must be one of: ${VALID_ITEM_TYPES.join(', ')}`)
];

export const libraryItemIdParamValidation = [
    param('itemId')
        .custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid Item ID format in URL parameter.')
];