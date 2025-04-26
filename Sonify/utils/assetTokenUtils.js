import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const secret = process.env.JWT_ASSET_SECRET;

if (!secret) {
    console.error("FATAL ERROR: JWT_ASSET_SECRET is not defined in environment variables.");
    process.exit(1); 
}

export const generateAssetToken = (payload) => {
    if (!payload || !payload.public_id || !payload.resource_type) {
        throw new Error("Invalid payload: Missing public_id or resource_type for asset token.");
    }
    const token = jwt.sign(payload, secret);
    return token;
};

export const verifyAssetToken = (token) => {
    try {
        const decoded = jwt.verify(token, secret);
        return decoded;
    } catch (error) {
        console.error("Asset token verification failed:", error.message);
        throw new Error(`Invalid asset token: ${error.message}`);
    }
};