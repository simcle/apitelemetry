import mongoose from "mongoose";
const { Schema } = mongoose
const LoggerSchema = new Schema({
    deviceId: {type: Schema.Types.ObjectId, index: true},
    level: {type: Number, default: 0},
    realTimeFlowRate: {type: Number, default: 0},
    instantTraffic: {type: Number, default: 0},
    status: {type: String, default: null},
    timestamp: {type: Date, index: true}
}, {
    timestamps: true
})

export default mongoose.model('LoggerData', LoggerSchema)