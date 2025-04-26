import mongoose from 'mongoose';
const { Schema } = mongoose;

const podcastCategorySchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true, index: true },
}, { timestamps: true });

const PodcastCategory = mongoose.model('PodcastCategory', podcastCategorySchema);

export default PodcastCategory;
