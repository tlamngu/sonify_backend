import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const contributorSchema = new Schema({
    artist_id: { type: ObjectId, ref: 'Artist', index: true },
    user_id: { type: ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    role: { type: String }
}, { _id: false });


const podcastEpisodeSchema = new Schema({
    podcast_id: { type: ObjectId, ref: 'Podcast', required: true, index: true },
    title: { type: String, required: true, trim: true },
    audio_url: { type: String, required: true },
    description: { type: String },
    release_date: { type: Date, index: true },
    duration_ms: { type: Number, required: true },
    play_count: { type: Number, default: 0, index: true },
    order_in_podcast: { type: Number, index: true },
    contributors: [contributorSchema],
    is_deleted: {type: Boolean, default: false, index: true}, 
}, { timestamps: true });

podcastEpisodeSchema.index({ podcast_id: 1, release_date: -1 });
podcastEpisodeSchema.index({ podcast_id: 1, order_in_podcast: 1 });

const PodcastEpisode = mongoose.model('PodcastEpisode', podcastEpisodeSchema);

export default PodcastEpisode;
