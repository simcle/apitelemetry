import mongoose from "mongoose";

const { Schema } = mongoose;

const MobileUsageSchema = new Schema({
    deviceId: {type: Schema.Types.ObjectId},
    date: {type: String},
    tx: {type: Number},
    rx: {type: Number}
}, {
    timestamps: true
})

MobileUsageSchema.index({deviceId: 1, date: 1}, {unique: true})
export default mongoose.model('MobileUsage', MobileUsageSchema)
