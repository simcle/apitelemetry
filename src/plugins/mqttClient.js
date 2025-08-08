import mqtt from "mqtt";
import { addToBuffer, setStatusDevice } from "../utils/bufferData.js";
import { addMobile } from "../utils/bufferMobile.js";
import { getSensorMap } from "../utils/sensorData.js";
import eventBus from "../events/eventBus.js";

export const startMqttClinet = (fastify) => {
    const client = mqtt.connect(process.env.MQTT_URL, {
        clientId: `node-client-${Date.now()}`,
        rejectUnauthorized: false
    })

    client.on('connect', () => {
        fastify.log.info('MQTT Connected')
        client.subscribe(['device/#', 'status/#'], (err) => {
            if(err) {
                fastify.log.error('❌ MQTT subscription error', err);
            } else {
                fastify.log.info('✅ Subscribed to topic awlr/+/data');
            }
        })
    })
    eventBus.on('logger', data => {
        const deviceId = data?.deviceId
        client.publish('logger/'+deviceId, JSON.stringify(data))
    })
    eventBus.on('alert', data => {
        const deviceId = data?.deviceId
        client.publish('alert/'+deviceId, JSON.stringify(data))
    })
    eventBus.on('sms', data => {
        const deviceId = data?.deviceId
        client.publish('sms/'+deviceId, JSON.stringify(data))
    })
    client.on('message', async (topic, message) => {
        try {

            // DATA
            if(topic.startsWith('device/')) {
                const [, deviceId] = topic.split('/')
                const sensorMap = getSensorMap(deviceId)
                
                const payload = JSON.parse(message.toString())
                if(payload['sensor_rs485']) {
                    let level = 0
                    let instantTraffic = 0
                    let realTimeFlowRate = 0
                    const raws = payload?.sensor_rs485 
                    for(const sensor of raws) {
                        if(sensor.name == 'level') {
                            const val = JSON.parse(sensor?.data)
                            level = (val[0] + sensorMap.elevasi).toFixed(2) // meter to cm
                        }
                        if(sensor.name == 'instantTraffic') {
                            const val = JSON.parse(sensor?.data)
                            instantTraffic = val[0].toFixed(2)
                        }
                        if((sensor.name == 'realTimeFlowRate')) {
                            const val = JSON.parse(sensor?.data)
                            realTimeFlowRate = val[0].toFixed(2)
                        }
                    }
                    const sensor = {
                        level: level,
                        instantTraffic: instantTraffic,
                        realTimeFlowRate: realTimeFlowRate,
                        timestamp : new Date()
                    }
                    addToBuffer(deviceId, sensor)
                    client.publish('sensor/'+deviceId, JSON.stringify(sensor))
                }
                if(payload['sensor_420']) {
                    let level = 0
                    let instantTraffic = 0
                    let realTimeFlowRate = 0
                    const data = parseInt(payload?.sensor_420[0]?.data)
                    const ma = data / 1000
                    level = scaleCurrentToMeter(ma) + sensorMap?.elevasi || 0
                   
                    const sensor = {
                        level: level.toFixed(2),
                        instantTraffic: instantTraffic,
                        realTimeFlowRate: realTimeFlowRate,
                        timestamp : new Date()
                    }
                    
                    addToBuffer(deviceId, sensor)
                    client.publish('sensor/'+deviceId, JSON.stringify(sensor))
                }
                if(payload['mobile']) {
                    const mobileCurrent = {}
                    mobileCurrent.tx = payload?.mobile?.tx
                    mobileCurrent.rx = payload?.mobile?.rx
                    addMobile(deviceId, mobileCurrent)
                }
            }

            // STATUS
            if(topic.startsWith('status/')) {
                const [, status] = topic.split('/')
                const payload = JSON.parse(message.toString())
                const deviceId = payload?.clientid
                let isOnline = false
                if(status == 'online') {
                    isOnline = true
                } else {
                    isOnline = false
                }
                setStatusDevice(deviceId, isOnline)
            }
            
        } catch (err) {
            fastify.log.error('❌ Error handling MQTT message:', err);
        }
    })

    client.on('error', (err) => {
        fastify.log.error('❌ MQTT connection error', err);
    })
}

function scaleCurrentToMeter(mA) {
    const sensorHeight = 7.6
    const minCurrent = 4
    const maxCurrent = 20
    const rangeMeter = 15

    if (mA < minCurrent) mA = minCurrent
    if (mA > maxCurrent) mA = maxCurrent

    const distance = (mA - minCurrent) * (rangeMeter / (maxCurrent - minCurrent))
    const level = distance - sensorHeight
    return level
}