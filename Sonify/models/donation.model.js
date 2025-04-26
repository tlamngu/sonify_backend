import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;
const Decimal128 = Schema.Types.Decimal128;

const donationSchema = new Schema({
    user_id: { type: ObjectId, ref: 'User', required: true, index: true },
    artist_id: { type: ObjectId, ref: 'Artist', required: true, index: true },
    amount: { type: Decimal128, required: true },
    currency: { type: String, required: true, uppercase: true, trim: true },
    donation_date: { type: Date, required: true, default: Date.now, index: true },
    payment_method: { type: String },
    status: { type: String, required: true, enum: ['pending', 'completed', 'failed', 'refunded'], index: true },
    transaction_id: { type: String, index: true },
}, { timestamps: true });

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
