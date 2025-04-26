import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const playlistSchema = new Schema({
    user_id: { type: ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    cover_image_path: { type: String },
    privacy_setting: { type: String, required: true, enum: ['public', 'private', 'shared'], default: 'private', index: true },
    is_public_collection: { type: Boolean, default: false, index: true },
    music_count: { type: Number, default: 0 },
    follower_count: { type: Number, default: 0, index: true },
    creation_date: { type: Date, required: true, default: Date.now },
    last_updated_date: { type: Date, default: Date.now },
    is_deleted: {type: Boolean, default: false, index: true},
}, { timestamps: true });

playlistSchema.pre('save', function(next) {
    this.last_updated_date = new Date();
    next();
});
playlistSchema.pre('findOneAndUpdate', function(next) {
    this.set({ last_updated_date: new Date() });
    next();
});

const Playlist = mongoose.model('Playlist', playlistSchema);

export default Playlist;
