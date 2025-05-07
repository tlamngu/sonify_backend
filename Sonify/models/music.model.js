import mongoose from "mongoose";
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;
const Mixed = Schema.Types.Mixed;

const collaboratorSchema = new Schema(
  {
    artist_id: { type: ObjectId, ref: "Artist", index: true },
    user_id: { type: ObjectId, ref: "User", required: false, index: true },
    name: { type: String, required: true },
    role: { type: String },
  },
  { _id: false }
);

const musicSchema = new Schema(
  {
    title: { type: String, required: true, index: true, trim: true },
    album_id: { type: ObjectId, ref: "Album", required: false, index: true },
    // album_name: { type: String },
    genre_id: { type: [ObjectId], ref: "Genre", required: false, index: true },
    // genre_name: { type: String },
    stream_pack: { type: String, required: true },
    cover_image: { type: String, require: true },
    duration_ms: { type: Number, required: true },
    release_date: { type: Date, index: true },
    credits: { type: Mixed },
    play_count: { type: Number, default: 0, index: true },
    like_count: { type: Number, default: 0, index: true },
    comment_count: { type: Number, default: 0, index: true },
    is_scheduled: { type: Boolean, default: false },
    scheduled_release_date: { type: Date },
    music_video: {
      video_url: { type: String },
      quality: { type: String },
    },
    collaborators: [collaboratorSchema],
    is_deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

musicSchema.virtual("primary_artist").get(function () {
  if (this.collaborators && this.collaborators.length > 0) {
    return this.collaborators[0];
  }
  return null;
});

const Music = mongoose.model("Music", musicSchema);

export default Music;
