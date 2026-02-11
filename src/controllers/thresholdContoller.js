import thresholdModel from '../models/thresholdModel.js'
import mongoose from 'mongoose'

export const getThresholdByDeviceId = async (request, reply) => {
    const deviceId = new mongoose.Types.ObjectId(request.params.id)
    try {
        const data = await thresholdModel.find({deviceId: deviceId}).sort({severity: 1})
        return reply.code(200).send({
            success: true,
            data
        })
    } catch (error) {
        return reply.code(400).send({
            success: false,
            message: error
        });
    }
}


export const createOrUpdateThreshold = async (request, reply) => {
    try {
        const raws = []
        const data = request.body

        for (let item of data) {
        // Validasi wajib
            if (
                typeof item.min !== 'number' ||
                typeof item.max !== 'number' ||
                !item.deviceId ||
                !item.name
            ) {
                return reply.code(400).send({
                success: false,
                message: 'Missing required fields'
                })
            }

            let doc = await thresholdModel.findOne({
                deviceId: item.deviceId,
                name: item.name
            })

            if (doc) {
                // Jika sudah ada → update nilai min dan max saja
                doc.min = item.min
                doc.max = item.max
            } else {
                // Jika belum ada → buat baru
                doc = new thresholdModel(item)
            }

            await doc.save() // Ini akan trigger pre('validate')
            raws.push(doc)
        }

        return reply.code(200).send({
            success: true,
            data: raws
        })

    } catch (error) {
        if (error.code === 11000) {
            return reply.code(409).send({
                success: false,
                message: 'Duplicate threshold (deviceId + name) already exists'
            })
        }
        console.log(error)
        return reply.code(500).send({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        })
    }
}