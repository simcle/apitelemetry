import sensorModel from "../models/sensorModel.js"
import thresholdModel from "../models/thresholdModel.js"
import alertModel from '../models/alert.js'
import loggerModel from '../models/loggerModel.js'
import eventBus from "../events/eventBus.js"
import cron from 'node-cron'
import mongoose from "mongoose"
const buffer = new Map()

export const addToBuffer = (deviceId, data) => {
    buffer.set(deviceId, data)
}

export const setStatusDevice = async (deviceId, status, ts = new Date()) => {
    if(mongoose.Types.ObjectId.isValid(deviceId)) return

    const updated = await sensorModel.findOneAndUpdate(
        {
            _id: deviceId,
            isOnline: {$ne: !!status}
        }, {
            $set: {isOnline: !!status}
        }, {
            new: true
        }

    )
    if(!updated) return
    
    const payloadAlert = {
        deviceId,
        type: status ? 'DEVICE ONLINE' : 'DEVICE OFFLINE',
        color: status ? 'text-green-500' : 'text-red-500',
        message: status
        ? 'Perangkat telah online dan terhubung ke server.'
        : 'Perangkat tidak terhubung (OFFLINE) Kemungkinan gangguan jaringan, power supply, atau restart tidak normal.',
        timestamp: ts
    }
    sensor.isOnline = status
    sensor.save()
    const data = await alertModel.create(payloadAlert)
    eventBus.emit('alert', data)

}


const flushBufferToDB = async () => {
    for(const [deviceId, latestData] of buffer.entries()) {
        const payloadSensor = { 
            deviceId: deviceId,
            level: latestData.level,
            realTimeFlowRate: latestData.realTimeFlowRate,
            instantTraffic: latestData.instantTraffic,
            status: null,
            timestamp: latestData.timestamp
        }
        try {
            const level = parseFloat(latestData.level)
            const alert = await thresholdModel.findOne({deviceId, min: {$lte: level}, max: {$gte: level}})
            if(alert) {
                payloadSensor.status = alert.name
                const payloadAlert = {
                    deviceId: deviceId,
                    type: alert.name,
                    color: alert.color,
                    message: alert.message,
                    level: level,
                    timestamp: latestData.timestamp
                }
                if(alert.name !== 'AMAN' ) {
                    const data = await alertModel.create(payloadAlert)
                    eventBus.emit('alert', data)
                }
            }

            const data = await loggerModel.create(payloadSensor)
            
            eventBus.emit('logger', data)
        } catch (error) {
            console.log(error)
        }
    }
}

// SIMPAN DATA PER 2 MENIT
cron.schedule('*/2 * * * *', async () => {
    setTimeout(() => {
        flushBufferToDB()
    }, 5000)
}, {
    timezone: 'Asia/Jakarta'
})