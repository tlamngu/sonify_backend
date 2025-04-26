import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const artistSchema = new Schema({
    user_id: { type: ObjectId, ref: 'User', required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String },
    image_path: { type: String },
    genres: [{ type: String }],
    follower_count: { type: Number, default: 0, index: true },
    is_deleted: {type: Boolean, default: false, index: true}, 
}, { timestamps: true });

const Artist = mongoose.model('Artist', artistSchema);

export default Artist;
