import mongoose from "mongoose";

const { Schema } = mongoose

const SensorSchema = new Schema({
    name: {type: String},
    address: {type: String},
    coordinate: {
        type: [Number],
        index: '2dsphere',
        default: null
    },
    gsm: {type: String},
    serialNumber: {type: String},
    status: {type: Boolean, default: true}
})

export default mongoose.model('Sensor', SensorSchema)