import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const musicLyricsSchema = new Schema({
    music_id: { type: ObjectId, ref: 'Music', required: true, unique: true, index: true },
    lyrics_text: { type: String, required: true },
    source: { type: String },
}, { timestamps: true });

const MusicLyrics = mongoose.model('MusicLyrics', musicLyricsSchema);

export default MusicLyrics;
