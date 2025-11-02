import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company'}
}, {
    timestamps: true
})

export default mongoose.model('User', userSchema)