import mongoose from 'mongoose'

const { Schema } = mongoose
const WaterLevelCategorySchema = new Schema({
  name: {
    type: String,
    enum: ['AMAN', 'WASPADA', 'SIAGA', 'AWAS'],
    required: true,
    unique: true
  },
  min: {
    type: Number,
    required: true
  },
  max: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: Number,
    required: true
  }
}, { timestamps: true })

export default mongoose.model('WaterLevelCategory', WaterLevelCategorySchema)