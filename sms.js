import mongoose from "mongoose";

const { Schema } = mongoose;

const SmsSchema = new Schema({
    serialNumber: {type: String, index: true},
    sender: {type: String},
    message: {type: String},
}, {
    timestamps: true
})

export default mongoose.model('Sms', SmsSchema)