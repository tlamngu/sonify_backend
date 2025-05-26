import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const userLikedItemSchema = new Schema({
    user_id: { type: ObjectId, ref: 'User', required: true, index: true },
    item_id: { type: ObjectId, required: true, index: true },
    item_type: { type: String, required: true, enum: ['music', 'album', 'playlist', 'podcast', 'episode', 'comment'], index: true },
    liked_date: { type: Date, required: true, default: Date.now, index: true },
}, { timestamps: true });

userLikedItemSchema.index({ user_id: 1, item_id: 1, item_type: 1 });
userLikedItemSchema.index({ item_id: 1, item_type: 1 });

const UserLikedItem = mongoose.model('UserLikedItem', userLikedItemSchema);

export default UserLikedItem;
