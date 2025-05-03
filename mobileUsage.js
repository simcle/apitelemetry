import mongoose from "mongoose";

const { Schema } = mongoose

const MobileUsageSchema = new Schema({
    serialNumber: {type: String, index: true},
    tx: {type: Number},
    rx: {type: Number}
}, {
    timestamps: true
})

export default mongoose.model('MobileUsage', MobileUsageSchema)