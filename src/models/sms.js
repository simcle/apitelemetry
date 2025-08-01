import mongoose from "mongoose";

const { Schema } = mongoose
const SmsSchema = new Schema({
    deviceId: {type: Schema.Types.ObjectId, index: true},
    sender: {type: String},
    message: {type: String}
}, {
    timestamps: true
})

export default mongoose.model('Sms', SmsSchema)