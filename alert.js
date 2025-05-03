import mongoose from "mongoose";
const { Schema } = mongoose;

const AlertSchema = new Schema({
    serialNumber: {type: String},
    type: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        default: 'text-gray-300'
    },
    level: {
        type: Number, // Meter air (jika applicable)
        default: null,
    },
    message: {
        type: String, // Isi pesan notifikasi
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
})

export default mongoose.model('Alert', AlertSchema)