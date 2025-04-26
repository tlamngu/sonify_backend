import mongoose from 'mongoose';
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;
const Mixed = Schema.Types.Mixed;

const userSettingsSchema = new Schema({
    user_id: { type: ObjectId, ref: 'User', required: true, unique: true, index: true },
    preferences: { type: Mixed, default: {} },
    last_updated: { type: Date, default: Date.now },
}, { timestamps: true });

userSettingsSchema.pre('save', function(next) {
    this.last_updated = new Date();
    next();
});

const UserSettings = mongoose.model('UserSetting', userSettingsSchema);

export default UserSettings;
