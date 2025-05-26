// In: ../validators/musicValidators.js (or a general query validator file)
import { query } from 'express-validator';
import mongoose from 'mongoose';

const VALID_SEARCH_TYPES = ['music', 'album', 'artist', 'all']; // 'all' is default

export const searchMusicValidation = [
    query('q').optional().isString().trim().withMessage('Search query must be a string.'),
    query('type').optional().isIn(VALID_SEARCH_TYPES).withMessage(`Invalid search type. Must be one of: ${VALID_SEARCH_TYPES.join(', ')}`),
    query('genreId').optional().custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid Genre ID format.'),
    query('albumId').optional().custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid Album ID format.'),
    query('artistId').optional().custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid Artist ID format.'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be an integer between 1 and 50.').toInt(),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.').toInt(),
    query('musicPage').optional().isInt({ min: 1 }).withMessage('Music page must be a positive integer.').toInt(),
    query('albumPage').optional().isInt({ min: 1 }).withMessage('Album page must be a positive integer.').toInt(),
    query('artistPage').optional().isInt({ min: 1 }).withMessage('Artist page must be a positive integer.').toInt(),
    query('musicLimit').optional().isInt({ min: 1, max: 20 }).withMessage('Music limit must be an integer between 1 and 20.').toInt(),
    query('albumLimit').optional().isInt({ min: 1, max: 20 }).withMessage('Album limit must be an integer between 1 and 20.').toInt(),
    query('artistLimit').optional().isInt({ min: 1, max: 20 }).withMessage('Artist limit must be an integer between 1 and 20.').toInt(),
];