import mqtt from 'mqtt'
import "dotenv/config"
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import cron from 'node-cron'
import eventBus from './event.js'
import { addTobuffer, flushBufferToDB } from './buffer.js'
import { insertSensor, getSensor, updateSensor, insertLogger, getLogger, getWaterStats24Hours, getWaterStatsByRagne, insertSMS, getSMS, insertMobileUsage, getMobileUsage, getAlert } from './controller.js'

const sensorHeight = 800 // Jarak sensor ke dasar sungai
const maxRange = 800 // maximum range sensor

const loggerData = {
    serialNumber: '',
    rawMa: 0,
    waterLevel: 0,
    distanceFromSensor: 0,
    signalStrength: {
        rssi: 0,
        csq: 0,
    },
    timestamp: new Date()
}

// MQTT CLIENT
const mqttClient = mqtt.connect('mqtts://mqtt.ndpteknologi.com:8883', {
    clientId: 'node-client',
    rejectUnauthorized: false
})

mqttClient.on('connect', () => {
    console.log('Conected to Broker')
    mqttClient.subscribe(['device/#','status/#'])
    
})

mqttClient.on('error', (err) => {
    console.log(err)
})

// EVENT UNTUK ALERT/NOTIFIKASI
eventBus.on('alert', (data) => {
    mqttClient.publish('alert', JSON.stringify(data))
})

// EVENT UNTUK SMS
eventBus.on('sms', (data) => {
    mqttClient.publish('sms', JSON.stringify(data))
})

// EVENT UNTUK UPDATE CHART DATA 
eventBus.on('chart', (data) => {
    mqttClient.publish('chart', JSON.stringify(data))
}) 

const mobileCurrent = {}
mqttClient.on('message', async (topic, message) => {
    try {

        // SENSOR DATA
        if(topic.startsWith('device/')) {
            const [, serialNumber] = topic.split('/')
            const payload = JSON.parse(message.toString())
            mobileCurrent['serialNumber'] = serialNumber
            mobileCurrent['tx'] = payload?.mobile?.tx
            mobileCurrent['rx'] = payload?.mobile?.rx
            loggerData.serialNumber = serialNumber
            loggerData.timestamp = new Date()
            if(payload['sensor_420']) {

                // DUMMY RANDOM 
                const random = Math.floor(Math.random() * (20000 - 4000 + 1)) + 4000;
                
                const raw = payload?.sensor_420?.[0]?.data || `"${random}"`
                const match = raw.match(/\d+/)
                const currentMa = parseInt(match[0]) / 1000 
                loggerData.waterLevel = getWaterLevel(currentMa, sensorHeight, maxRange)
            }
            if(payload['sensor_rs485']) {
                console.log('ini 485')
            }
            addTobuffer(serialNumber, {
                ...loggerData,
                timestamp: new Date()
            })
            mqttClient.publish('level', `${loggerData.waterLevel}`)
            
        }
        if(topic.startsWith('status/')) {
            const [, status] = topic.split('/')
            const payload = JSON.parse(message.toString())
            
            const data = {
                ...payload,
                status: status
            }
            eventBus.emit('status', data)
            await updateSensor(data)
        }
    } catch (error) {
        console.error('❌ MQTT message error:', error.message);
    }
})

// SENOSOR SCALE
const  getWaterLevel = (currentMa, sensorHeight, maxRange) => {
	if(currentMa < 4 || currentMa > 20) return 0
	const distanceSensor = ((currentMa - 4) * maxRange) / 16
	const waterLevel = sensorHeight - distanceSensor
	return waterLevel.toFixed(2)
	return {
		waterLevel: parseFloat(waterLevel.toFixed(2)),
		distanceSensor: parseFloat(distanceSensor.toFixed(2))
	}
} 

// CRONJOB SENSOR PER 2 MENIT
cron.schedule('*/2 * * * *', async () => {
    setTimeout(() => {
        flushBufferToDB()
    }, 5000)
})


// CRONJOB MOBILE USAGE PER 1 HARI
cron.schedule('59 23 * * *', async () => {
    await insertMobileUsage(mobileCurrent)
})

// SERVER
const app = express()

app.use(cors({origin: '*', methods: ['*']}))
app.use(express.json())

// ROUTER
app.post('/sensor', insertSensor)
app.get('/sensor', getSensor)
app.get('/logger', getLogger)
app.get('/logger/:serialNumber', getWaterStats24Hours)
app.get('/logger/report/:serialNumber', getWaterStatsByRagne)
app.post('/sms', insertSMS)
app.get('/sms', getSMS)
app.get('/mobile', getMobileUsage)
app.get('/alert', getAlert)

const PORT = 3000
const dbURL = process.env.DBURL
mongoose.set('strictQuery', false)
mongoose.connect(dbURL, {
    autoIndex: true
})
.then(() => {
    app.listen(PORT, () => {
        console.log('server listen on PORT: '+PORT)
    })
})
