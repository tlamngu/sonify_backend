import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const playlistItemSchema = new Schema({
    playlist_id: { type: ObjectId, ref: 'Playlist', required: true, index: true },
    music_id: { type: ObjectId, ref: 'Music', required: true, index: true },
    order: { type: Number, index: true },
    added_date: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

playlistItemSchema.index({ playlist_id: 1, music_id: 1 }, { unique: true });
playlistItemSchema.index({ playlist_id: 1, order: 1 });

const PlaylistItem = mongoose.model('PlaylistItem', playlistItemSchema);

export default PlaylistItem;
