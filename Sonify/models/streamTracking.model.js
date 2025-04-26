import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const StreamTrackingSchema = new Schema({
    user_id: { type: ObjectId, ref: 'User', required: true, unique: true, index: true },
    music_id: { type: ObjectId, ref: 'Music', required: true, index: true },
    time: {type: Date, default: Date.now },
}, { timestamps: true });

const StreamTracking = mongoose.model('StreamTracking', StreamTrackingSchema);

export default StreamTracking;
