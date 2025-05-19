import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const artistSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true
    },
    user_id: { 
        type: ObjectId,
        ref: 'User',
        index: true,
        sparse: true 
    },
    bio: {
        type: String,
        trim: true
    },
    profile_image_path: {
        type: String
    },
    genres: [{ 
        type: ObjectId,
        ref: 'Genre',
        index: true
    }],
    is_deleted: {
        type: Boolean,
        default: false,
        index: true
    },
}, { timestamps: true });


const Artist = mongoose.model('Artist', artistSchema);

export default Artist;