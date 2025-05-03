import mongoose from "mongoose";

const { Schema } = mongoose;

const LoggerSchema = new Schema({
    serialNumber: {type: String, index: true},
    rawMa: {type: Number},
    waterLevel: {type: Number},
    distanceFromSensor: {type: Number},
    signalStrength: {
        rssi: {type: Number, default: null},
        csq: {type: Number, default: null},
    },
    status: {type: String, default: null},
    timestamp: {
        type: Date,
        required: true,
        index: true
    }
}, {
    timestamps: true
})

export default mongoose.model('Logger', LoggerSchema)