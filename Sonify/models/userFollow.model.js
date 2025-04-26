import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const userFollowSchema = new Schema({
    user_id: { type: ObjectId, ref: 'User', required: true, index: true },
    target_id: { type: ObjectId, required: true, index: true },
    target_type: { type: String, required: true, enum: ['artist', 'user', 'playlist', 'podcast'], index: true },
    followed_date: { type: Date, required: true, default: Date.now, index: true },
}, { timestamps: true });

userFollowSchema.index({ user_id: 1, target_id: 1, target_type: 1 }, { unique: true });
userFollowSchema.index({ target_id: 1, target_type: 1 });

const UserFollow = mongoose.model('UserFollow', userFollowSchema);

export default UserFollow;
