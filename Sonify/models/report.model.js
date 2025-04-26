import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const reportSchema = new Schema({
    user_id: { type: ObjectId, ref: 'User', required: true, index: true },
    item_id: { type: ObjectId, required: true, index: true },
    item_type: { type: String, required: true, enum: ['music', 'album', 'playlist', 'comment', 'user', 'artist', 'episode', 'podcast'], index: true },
    reason: { type: String, required: true },
    description: { type: String },
    report_date: { type: Date, required: true, default: Date.now, index: true },
    status: { type: String, required: true, enum: ['pending', 'processing', 'resolved', 'rejected'], default: 'pending', index: true },
    admin_user_id: { type: ObjectId, ref: 'User', index: true },
    resolution_notes: { type: String },
    resolved_date: { type: Date },
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);

export default Report;
