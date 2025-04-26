import mongoose from 'mongoose';
const { Schema } = mongoose;
const Mixed = Schema.Types.Mixed;

const bannerSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String },
    image_path: { type: String },
    target_url: { type: String },
    start_date: { type: Date, index: true },
    end_date: { type: Date, index: true },
    is_permanent_dismissible: { type: Boolean, default: false },
    display_locations: [{ type: String, index: true }],
    target_audience: { type: Mixed },
    is_active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
