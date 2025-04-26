import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const commentSchema = new Schema({
    user_id: { type: ObjectId, ref: 'User', required: true, index: true },
    item_id: { type: ObjectId, required: true, index: true },
    item_type: { type: String, required: true, enum: ['music', 'album', 'playlist', 'episode'], index: true, default: 'music'},
    comment_text: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5 },
    parent_comment_id: { type: ObjectId, ref: 'Comment', index: true },
    like_count: { type: Number, default: 0 },
    replies_count: { type: Number, default: 0 },
    is_edited: { type: Boolean, default: false },
    is_deleted: {type: Boolean, default: false, index: true}, 
}, { timestamps: true });

commentSchema.index({ item_id: 1, item_type: 1, createdAt: -1 });
commentSchema.index({ parent_comment_id: 1, createdAt: 1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
