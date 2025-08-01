import mongoose from "mongoose";
const { Schema } = mongoose
const AlertSchema = new Schema({
    deviceId: {
        type: Schema.Types.ObjectId,
        index: true
    },
    type: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: 'text-gray-300'
    },
    level: {
        type: Number,
        default: null
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now()
    }
})

export default mongoose.model('Alert', AlertSchema)