import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const LikeTrackingSchema = new Schema({
    user_id: { type: ObjectId, required: true, unique: false}, 
    item_id: { type: ObjectId, required: true},
    item_type: { 
        type: String,
        required: true,
        enum: ['music', 'album', 'playlist', 'artist', 'podcast', 'episode', 'comment'], 
    },
    action: { 
        type: String,
        enum: ['liked', 'unliked'],
        default: 'liked', 
        required: true
    },
    time: {type: Date, default: Date.now}, 
}, { timestamps: true }); 


const LikeTracking = mongoose.model('LikeTracking', LikeTrackingSchema); 

export default LikeTracking;