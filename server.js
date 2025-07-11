import mqtt from 'mqtt'
import "dotenv/config"
import express, { json } from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import cron from 'node-cron'
import eventBus from './event.js'
import { addTobuffer, flushBufferToDB } from './buffer.js'
import { getQuota, insertSensor, getSensor, updateSensor, insertLogger, getLogger, getWaterStats24Hours, getWaterStatsByRagne, insertSMS, getSMS, insertMobileUsage, getMobileUsage, getAlert , getWaterlevelCategory} from './controller.js'

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
    clientId: `node-client-${Date.now()}`,
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
    mqttClient.publish('alert/'+data.serialNumber, JSON.stringify(data))
})

// EVENT UNTUK SMS
eventBus.on('sms', (data) => {
    mqttClient.publish('sms/'+data.serialNumber, JSON.stringify(data))
})

// EVENT UNTUK UPDATE CHART DATA 
eventBus.on('chart', (data) => {
    mqttClient.publish('chart/'+data.serialNumber, JSON.stringify(data))
}) 

const mobileCurrent = {}
mqttClient.on('message', async (topic, message) => {
    try {
        let level = 0
        let realTimeFlowRate = 0
        let instanTraffic = 0

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
                // const random = Math.floor(Math.random() * (20000 - 4000 + 1)) + 4000;
                
                // const raw = payload?.sensor_420?.[0]?.data || `"${random}"`
                // const match = raw.match(/\d+/)
                // const currentMa = parseInt(match[0]) / 1000 
                // loggerData.waterLevel = getWaterLevel(currentMa, sensorHeight, maxRange)
            }
            if(payload['sensor_rs485']) {
                // const parse = JSON.parse(payload?.sensor_rs485)
                const raws = payload?.sensor_rs485 
                for (const sensor of raws ) {
                    const raw = JSON.parse(sensor.data)
                    if(sensor.name == 'level') {
                        level = (raw[0] * 100).toFixed(2) // meter to cm
                        loggerData.waterLevel = level
                    }

                    if(sensor.name == 'realTimeFlowRate') {
                        realTimeFlowRate = raw[0].toFixed(2)
                    }

                    if(sensor.name == 'instantTraffic') {
                        instanTraffic = raw[0].toFixed(2)
                    }
                }

            }
            addTobuffer(serialNumber, {
                ...loggerData,
                timestamp: new Date()
            })
            const flow = {
                realTimeFlowRate: realTimeFlowRate,
                instanTraffic: instanTraffic
            }
            mqttClient.publish('level/'+serialNumber, `${loggerData.waterLevel}`)
            mqttClient.publish('flow/'+serialNumber, JSON.stringify(flow))
            
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
}, {
    timezone: 'Asia/Jakarta'
})


// CRONJOB MOBILE USAGE PER 1 HARI
cron.schedule('59 23 * * *', async () => {
    await insertMobileUsage(mobileCurrent)
}, {
    timezone: 'Asia/Jakarta'
})

// SERVER
const app = express()

app.use(cors({origin: '*', methods: ['*']}))
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

// ROUTER
app.post('/sensor', insertSensor)
app.get('/sensor/:sn', getSensor)
app.get('/logger', getLogger)
app.get('/logger/:serialNumber', getWaterStats24Hours)
app.get('/logger/report/:serialNumber', getWaterStatsByRagne)
app.post('/sms', insertSMS)
app.get('/sms/:serialNumber', getSMS)
app.get('/mobile/:serialNumber', getMobileUsage)
app.get('/alert/:serialNumber', getAlert)
app.get('/quota/:serialNumber', getQuota)
app.get('/water-category/:serialNumber', getWaterlevelCategory)

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
