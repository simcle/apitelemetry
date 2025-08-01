import mongoose from 'mongoose'
import AlertModel from '../models/alert.js'

export const getAlertByDeviceId = async (request, reply) => {
    const deviceId = new mongoose.Types.ObjectId(request.params.id)
    try {
        const data = await AlertModel.aggregate([
            {$match: {deviceId: deviceId}},
            {$sort: {timestamp: -1}},
            {$limit: 60}
        ])
        reply.code(200).send({
            success: true,
            data
        })
    } catch (error) {
        console.log(error)
    }
}