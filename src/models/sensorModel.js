import mongoose from "mongoose";
const sensorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    serialNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    logger: {
        loggerType: {
            type: String,
            required: true
        },
        loggerIp: {
            type: String,
            required: true
        }
    },
    gsmNumber: {
        type: String,
        required: true
    },
    cctvIp: {
        type: String,
        default: null,
    },
    location: {
        address: {
            type: String,
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    sensorType: {
        type: String,
        required: true
    },
    isOnline: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

export default mongoose.model('SensorData', sensorSchema)