import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;
const Mixed = Schema.Types.Mixed;

const activityFeedSchema = new Schema({
    user_id: { type: ObjectId, ref: 'User', required: true, index: true },
    activity_type: {
        type: String,
        required: true,
        enum: ['listen', 'like_item', 'add_library', 'create_playlist', 'update_playlist', 'follow', 'comment', 'share'],
        index: true
    },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    details: { type: Mixed }
}, { timestamps: true });


const ActivityFeed = mongoose.model('ActivityFeed', activityFeedSchema);

export default ActivityFeed;
