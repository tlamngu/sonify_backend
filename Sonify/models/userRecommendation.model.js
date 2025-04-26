import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const userRecommendationSchema = new Schema({
    user_id: { type: ObjectId, ref: 'User', required: true, index: true },
    item_id: { type: ObjectId, required: true, index: true },
    item_type: { type: String, required: true, enum: ['music', 'album', 'artist', 'playlist', 'podcast'], index: true },
    recommendation_date: { type: Date, required: true, default: Date.now, index: true },
    reason: { type: String },
    score: { type: Number },
    source_algorithm: { type: String },
}, { timestamps: true });

const UserRecommendation = mongoose.model('UserRecommendation', userRecommendationSchema);

export default UserRecommendation;
