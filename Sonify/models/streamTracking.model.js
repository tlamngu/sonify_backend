import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const StreamTrackingSchema = new Schema({
    user_id: { type: ObjectId, ref: 'User', required: true }, // Not unique on its own anymore
    music_id: { type: ObjectId, ref: 'Music', required: true, index: true },
    play_count: { type: Number, default: 1 },
    last_played_at: { type: Date, default: Date.now, index: true },
}, { timestamps: true }); 

StreamTrackingSchema.index({ user_id: 1, music_id: 1 }, { unique: true });

const StreamTracking = mongoose.model('StreamTracking', StreamTrackingSchema);

export default StreamTracking;