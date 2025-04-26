import { sendError } from '../utils/responseUtils.js';

const errorHandler = (err, req, res, next) => {
    console.error('ERROR STACK:', err.stack);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || null;

    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 400;
        message = `Resource not found. Invalid ID format: ${err.path}`;
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        statusCode = 400;
        message = `Duplicate field value entered: ${field} must be unique. Value: ${value}`;
        errors = [{ field: field, message: `The ${field} '${value}' is already taken.` }]
    }

    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed. Please check your input.';
        errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
    }

    if (err.name === 'JsonWebTokenError') {
         statusCode = 401;
         message = 'Not authorized, invalid token signature.';
     }
     if (err.name === 'TokenExpiredError') {
         statusCode = 401;
         message = 'Not authorized, token expired.';
     }

    sendError(res, statusCode, message, errors);
};

export default errorHandler;