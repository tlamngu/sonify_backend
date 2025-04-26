import { validationResult } from 'express-validator';
import { sendError } from '../utils/responseUtils.js';

export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const extractedErrors = errors.array().map((err) => ({
            field: err.param || err.path,
            message: err.msg,
        }));
        return sendError(
            res,
            400,
            'Validation failed. Please check your input.',
            extractedErrors
        );
    }
    next();
};