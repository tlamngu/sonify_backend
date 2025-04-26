import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const LikeTrackingSchema = new Schema({
    user_id: { type: ObjectId, ref: 'User', required: true, unique: true, index: true },
    music_id: { type: ObjectId, ref: 'Music', required: true, index: true },
    time: {type: Date, default: Date.now },
}, { timestamps: true });

const LikeTracking = mongoose.model('LikeTrackings', LikeTrackingSchema);

export default LikeTracking;
