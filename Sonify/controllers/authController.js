import { User } from '../models/models.js';
import { generateAccessToken, generateVerificationToken, verifyToken } from '../utils/jwtUtils.js';
import { sendSuccess, sendError } from '../utils/responseUtils.js';
import { sanitizeUserOutput } from '../utils/sanitizeUser.js';
import { sendValidationEmail } from '../utils/emailUtils.js';
import dotenv from 'dotenv';

dotenv.config();

const WEB_DOMAIN = process.env.WEB_DOMAIN;
const MAX_SESSIONS = parseInt(process.env.MAX_ACTIVE_SESSIONS || '10');

if (!WEB_DOMAIN) {
    console.warn('WARN: WEB_DOMAIN environment variable is not set. Verification URLs might be incomplete.');
}

export const signup = async (req, res, next) => {
    const { username, email, password, phone_number, profile_image_path } = req.body;

    try {
        const newUser = await User.create({
            username,
            email,
            password_hash: password,
            phone_number,
            profile_image_path,
            role: 'user',
            is_email_verified: false,
            is_deleted: false,
            access_tokens: [],
        });

        const verificationPageUrl = `${WEB_DOMAIN || ''}/register/verify/${newUser._id}`;

        sendSuccess(
            res,
            201,
            {
                user: sanitizeUserOutput(newUser),
                verificationPageHint: `${verificationPageUrl}`
            },
            'User registered successfully. Verification required.'
        );

    } catch (error) {
        next(error);
    }
};

export const requestVerification = async (req, res, next) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email, is_deleted: false });

        if (!user) {
            return sendError(res, 404, 'User with this email not found or account is inactive.');
        }

        if (user.is_email_verified) {
            return sendError(res, 400, 'Email is already verified.');
        }

        const verificationToken = generateVerificationToken(user._id);
        const verificationUrl = `${WEB_DOMAIN || ''}/verify/t/${verificationToken}`;
        if(process.env.NODE_ENV == "development"){
            console.log('--- DEV EMAIL VERIFICATION ---');
            console.log(`To: ${user.email}`);
            console.log(`Link: ${verificationUrl}`);
            console.log('--- END DEV EMAIL VERIFICATION ---');
        }
        
        sendValidationEmail({
          username: user.username,
          validateURL: verificationUrl,
          toEmail: user.email,
          logoUrl: 'https://res.cloudinary.com/dho0jgfpy/image/upload/v1749214591/SonifyPreview_mbewmi.png',
        })
        sendSuccess(
            res,
            200,
            null,
            process.env.NODE_ENV == "development" ? 'Verification email requested. Check inbox (or console log for dev).' : "Verification email sent successfully."
        );

    } catch (error) {
        next(error);
    }
};

export const verifyEmail = async (req, res, next) => {
    const { token } = req.params;

    if (!token) {
        return sendError(res, 400, 'Verification token is missing.');
    }

    try {
        const decoded = verifyToken(token, 'verify');

        if (!decoded || decoded.purpose !== 'verify-email' || !decoded.id) {
            return sendError(res, 400, 'Invalid or expired verification token.');
        }

        const user = await User.findOne({ _id: decoded.id, is_deleted: false });

        if (!user) {
            return sendError(res, 404, 'User not found or account inactive.');
        }

        if (user.is_email_verified) {
            return sendSuccess(res, 200, null, 'Email already verified.');
        }

        user.is_email_verified = true;
        await user.save();

        sendSuccess(res, 200, null, 'Email verified successfully.');

    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email, is_deleted: false }).select('+password_hash');

        if (!user) {
            return sendError(res, 401, 'Invalid credentials.');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return sendError(res, 401, 'Invalid credentials.');
        }

        if (!user.is_email_verified) {
            const requestVerifUrlHint = `/api/v1/auth/request-verification`;
            return sendError(res, 403, `Email not verified. Please verify your email first. Request new link via POST to ${requestVerifUrlHint} if needed.`);
        }

        const newAccessToken = generateAccessToken(user._id, user.role);

        const newTokenEntry = {
            token: newAccessToken,
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
            is_deleted: false
        };

        const activeTokens = user.access_tokens.filter(t => !t.is_deleted);
        const deletedTokens = user.access_tokens.filter(t => t.is_deleted);

        let updatedActiveTokens = [...activeTokens, newTokenEntry];

        if (updatedActiveTokens.length > MAX_SESSIONS) {
            updatedActiveTokens.sort((a, b) => b.createdAt - a.createdAt);
            updatedActiveTokens = updatedActiveTokens.slice(0, MAX_SESSIONS);
        }

        user.access_tokens = [...updatedActiveTokens, ...deletedTokens];
        user.last_login_date = new Date();

        await user.save();

        sendSuccess(
            res,
            200,
            {
                token: newAccessToken,
                user: sanitizeUserOutput(user)
            },
            'Login successful.'
        );

    } catch (error) {
        next(error);
    }
};


export const logout = async (req, res, next) => {
    const userId = req.user._id;
    const tokenToInvalidate = req.token;

    try {
        const updateResult = await User.updateOne(
            {
                _id: userId,
                'access_tokens.token': tokenToInvalidate,
                'access_tokens.is_deleted': false
            },
            {
                $set: { 'access_tokens.$.is_deleted': true, 'access_tokens.$.lastUsedAt': Date.now() }
            }
        );

        if (updateResult.matchedCount === 0) {
            console.warn(`Logout: Token not found or already invalidated for user ${userId}`);
        }

        sendSuccess(res, 200, null, 'Logout successful.');

    } catch (error) {
        next(error);
    }
};

export const getMe = async (req, res, next) => {
    sendSuccess(res, 200, { user: req.user });
};