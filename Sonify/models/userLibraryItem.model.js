import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const userLibraryItemSchema = new Schema({
    user_id: { type: ObjectId, ref: 'User', required: true, index: true },
    music_id: { type: ObjectId, ref: 'Music', required: true, index: true },
    added_date: { type: Date, required: true, default: Date.now, index: true },
}, { timestamps: true });

userLibraryItemSchema.index({ user_id: 1, music_id: 1 }, { unique: true });

const UserLibraryItem = mongoose.model('UserLibraryItem', userLibraryItemSchema);

export default UserLibraryItem;
