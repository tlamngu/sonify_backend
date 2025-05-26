import { body } from 'express-validator';

export const createGenreValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Genre name is required.')
        .isString().withMessage('Genre name must be a string.')
        .isLength({ min: 2, max: 50 }).withMessage('Genre name must be between 2 and 50 characters.'),
];