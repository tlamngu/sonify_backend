import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const hostSchema = new Schema({
    artist_id: { type: ObjectId, ref: 'Artist', index: true },
    user_id: { type: ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
}, { _id: false });

const podcastSchema = new Schema({
    name: { type: String, required: true, index: true, trim: true },
    description: { type: String },
    cover_image_path: { type: String },
    category_id: { type: ObjectId, ref: 'PodcastCategory', index: true },
    category_name: { type: String },
    episode_count: { type: Number, default: 0 },
    follower_count: { type: Number, default: 0, index: true },
    last_episode_date: { type: Date, index: true },
    hosts: [hostSchema],
    is_deleted: {type: Boolean, default: false, index: true},
}, { timestamps: true });

const Podcast = mongoose.model('Podcast', podcastSchema);

export default Podcast;
