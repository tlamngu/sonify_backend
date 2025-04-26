import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_SECRET = process.env.JWT_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const VERIFY_SECRET = process.env.JWT_VERIFY_SECRET;
const VERIFY_EXPIRES_IN = process.env.JWT_VERIFY_EXPIRES_IN;

if (!ACCESS_SECRET || !VERIFY_SECRET) {
    throw new Error(
        'FATAL ERROR: JWT_SECRET and JWT_VERIFY_SECRET environment variables are required.'
    );
}

export const generateAccessToken = (userId, role) => {
    const payload = { id: userId, role: role };
    return jwt.sign(payload, ACCESS_SECRET, {
        expiresIn: ACCESS_EXPIRES_IN || '1d',
    });
};

export const generateVerificationToken = (userId) => {
    const payload = { id: userId, purpose: 'verify-email' };
    return jwt.sign(payload, VERIFY_SECRET, {
        expiresIn: VERIFY_EXPIRES_IN || '15m',
    });
};

export const verifyToken = (token, type) => {
    const secret = type === 'verify' ? VERIFY_SECRET : ACCESS_SECRET;
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        console.error(`JWT Verification Error (${type}):`, error.message);
        return null;
    }
};