// middlewares/authMiddleware.js

import { verifyToken } from '../utils/jwtUtils.js';
import { sendError } from '../utils/responseUtils.js';
import { User } from '../models/models.js';
import { sanitizeUserOutput } from '../utils/sanitizeUser.js';

export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return sendError(res, 401, 'Not authorized, no token provided.');
    }

    try {
        const decoded = verifyToken(token, 'access');
        if (!decoded || !decoded.id) {
            return sendError(res, 401, 'Not authorized, invalid token payload.');
        }

        const freshUser = await User.findOne({
            _id: decoded.id,
            is_deleted: false
        });

        if (!freshUser) {
             return sendError(res, 401, 'Not authorized, user not found or account disabled.');
        }

        const activeToken = freshUser.access_tokens.find(
            (t) => t.token === token && t.is_deleted === false
        );

        if (!activeToken) {
            return sendError(res, 401, 'Not authorized, token invalid or session expired.');
        }

        try {
           await User.updateOne(
               { _id: freshUser._id, 'access_tokens.token': token },
               { $set: { 'access_tokens.$.lastUsedAt': Date.now() } }
           );
        } catch(updateError) {
            console.error("Failed to update token lastUsedAt:", updateError);
        }

        req.user = sanitizeUserOutput(freshUser);
        req.token = token;
        next();

    } catch (error) {
        next(error);
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return sendError(res, 401, 'Not authorized (user data missing for role check).');
        }
        if (!roles.includes(req.user.role)) {
            return sendError(
                res,
                403,
                `Forbidden: Your role ('${req.user.role}') is not authorized to access this resource.`
            );
        }
        next();
    };
};

export const onlyAdmin = authorize('admin');

export const onlyArtist = authorize('artist');

export const onlyModerator = authorize('moderator');

export const onlyUser = authorize('user');

export const adminOrArtist = authorize('admin', 'artist');

export const adminOrModerator = authorize('admin', 'moderator');

export const adminModeratorOrArtist = authorize('admin', 'moderator', 'artist');