import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Schema } = mongoose;

const userSchema = new Schema({
    username: { type: String, required: true, unique: false, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password_hash: { type: String, required: true, select: false }, 
    phone_number: { type: String, unique: true, sparse: true, trim: true, index: true },
    profile_image_path: { type: String },
    role: { type: String, required: true, enum: ['user', 'admin', 'moderator', 'artist'], default: 'user' },
    is_email_verified: { type: Boolean, required: true, default: false },
    registration_date: { type: Date, required: true, default: Date.now },
    last_login_date: { type: Date },
    access_tokens: [
        {
            token: {
                type: String,
                required: true,
            },
            lastUsedAt: {
                type: Date,
                default: Date.now,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
            is_deleted: {type: Boolean, default: false},
             _id: false 
        }
    ],
    is_deleted: {type: Boolean, default: false, index: true}, 
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password_hash')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(
            parseInt(process.env.BCRYPT_SALT_ROUNDS || '10')
        );
        this.password_hash = await bcrypt.hash(this.password_hash, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    let hashToCompare = this.password_hash;
    if (!hashToCompare) {
        const userWithPass = await mongoose.model('User').findById(this._id).select('+password_hash').lean();
        if (!userWithPass) throw new Error("User not found during password comparison.");
        hashToCompare = userWithPass.password_hash;
         if (!hashToCompare) throw new Error("Password hash not found for user.");
    }
    return await bcrypt.compare(candidatePassword, hashToCompare);
};


const User = mongoose.model('User', userSchema);

export default User;
