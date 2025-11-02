import mongoose from "mongoose";
const { Schema } = mongoose;

const CompanySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    logo: {
        type: String,
        default: null
    }
})

export default mongoose.model('Company', CompanySchema);
