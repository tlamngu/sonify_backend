import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;
const Mixed = Schema.Types.Mixed;

const collaboratorSchema = new Schema({
    artist_id: { type: ObjectId, ref: 'Artist', index: true },
    user_id: { type: ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    role: { type: String }
}, { _id: false });

const albumSchema = new Schema({
    name: { type: String, required: true, index: true, trim: true },
    genre_id: { type: ObjectId, ref: 'Genre', index: true },
    genre_name: { type: String },
    cover_image_path: { type: String },
    release_date: { type: Date, index: true },
    description: { type: String },
    credits: { type: Mixed },
    music_count: { type: Number, default: 0 },
    collaborators: [collaboratorSchema],
    is_deleted: {type: Boolean, default: false, index: true},
}, { timestamps: true });

albumSchema.virtual('primary_artist').get(function() {
  if (this.collaborators && this.collaborators.length > 0) {
    return this.collaborators[0];
  }
  return null;
});


const Album = mongoose.model('Album', albumSchema);

export default Album;
