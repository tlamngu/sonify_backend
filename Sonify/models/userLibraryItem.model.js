import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const userLibraryItemSchema = new Schema({
    user_id: { type: ObjectId, ref: 'User', required: true, index: true },
    item_id: { type: ObjectId, required: true, index: true },
    item_type: { 
        type: String,
        required: true,
        enum: ['music', 'album', 'playlist', 'artist'], 
        index: true
    },
    added_date: { type: Date, required: true, default: Date.now, index: true },
}, { timestamps: true });

userLibraryItemSchema.index({ user_id: 1, item_id: 1, item_type: 1 }, { unique: true });

const UserLibraryItem = mongoose.model('UserLibraryItem', userLibraryItemSchema);

export default UserLibraryItem;