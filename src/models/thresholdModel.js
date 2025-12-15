import mongoose from "mongoose";

const { Schema } = mongoose;

const ThresholdSchema = new Schema({
    deviceId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    name: {
        type: String,
        enum: ['AMAN', 'WASPADA', 'SIAGA', 'AWAS'],
        required: true
        // unique: true // dihapus
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
}, {
    timestamps: true
});

// Compound index: deviceId + name harus unik (AMAN, WASPADA, dst per logger unik)
ThresholdSchema.index({ deviceId: 1, name: 1 }, { unique: true });

ThresholdSchema.pre('validate', function (next) {
    const categoryDefaults = {
        AMAN: {
            color: 'text-green-500',
            message: 'Kondisi normal. Tidak ada ancaman banjir.',
            severity: 1
        },
        WASPADA: {
            color: 'text-blue-500',
            message: 'Harap tingkatkan kewaspadaan. Posisi air mulai mengalami kenaikan.',
            severity: 2
        },
        SIAGA: {
            color: 'text-yellow-500',
            message: 'Ketinggian air cukup tinggi. Siapkan mitigasi banjir dan peringatan dini.',
            severity: 3
        },
        AWAS: {
            color: 'text-red-500',
            message: 'Ketinggian air berbahaya. Lakukan tindakan darurat!',
            severity: 4
        }
    };
    
    const defaults = categoryDefaults[this.type];
    if (defaults) {
        this.color = defaults.color;
        this.message = defaults.message;
        this.severity = defaults.severity;
    }

    next();
})

export default mongoose.model('ThresholdLevel', ThresholdSchema);