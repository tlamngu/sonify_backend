import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const friendshipSchema = new Schema({
    user_id_1: { type: ObjectId, ref: 'User', required: true, index: true },
    user_id_2: { type: ObjectId, ref: 'User', required: true, index: true },
    requester_id: { type: ObjectId, ref: 'User', required: true },
    status: { type: String, required: true, enum: ['pending', 'accepted', 'rejected', 'blocked'], default: 'pending', index: true },
    request_date: { type: Date, default: Date.now },
    accepted_date: { type: Date },
}, { timestamps: true });

friendshipSchema.index({ user_id_1: 1, user_id_2: 1 }, { unique: true });
friendshipSchema.index({ user_id_1: 1, status: 1 });
friendshipSchema.index({ user_id_2: 1, status: 1 });

friendshipSchema.pre('save', function(next) {
    if (!this.user_id_1 || !this.user_id_2) {
       return next(new Error('Both user IDs are required.'));
    }
    if (this.user_id_1.toString() === this.user_id_2.toString()) {
       return next(new Error('Users cannot friend themselves.'));
    }
    if (this.user_id_1.toString() > this.user_id_2.toString()) {
        const temp = this.user_id_1;
        this.user_id_1 = this.user_id_2;
        this.user_id_2 = temp;
    }
    next();
});

const Friendship = mongoose.model('Friendship', friendshipSchema);

export default Friendship;
