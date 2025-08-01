import SmsModel from '../models/sms.js'
import eventBus from '../events/eventBus.js'
import sensorModel from '../models/sensorModel.js'
import axios from 'axios'

export const insertSms = async (request, reply) => {
    const payload = request.body
    try {
        const data = await SmsModel.create(payload)
        eventBus.emit('sms', data)
    } catch (error) {
        console.log(error)
    }
} 

export const getSms = async (request, reply) => {
    const deviceId = request.params.id 
    try {
        const data = await SmsModel.find({deviceId: deviceId}).sort({createdAt: -1}).limit(60)
        reply.code(200).send({
            success: true,
            data
        })
    } catch (error) {
        
    }
}

export const getQuota = async (request, reply) => {
    const deviceId = request.params.id 
    try {
        const device = await sensorModel.findById(deviceId)
        const ip = device.logger?.loggerIp
        const authLogin = {
            "username": "admin",
            "password": "Admin@19284637"
        }
        const url = 'http://'+ip+'/api'
        const login = await axios.post(`${url}/login`, authLogin, {timeout: 5000})
        const token = login.data.data.token
        await axios.post(`${url}/messages/actions/send`, {
            "data": {
                "number": "3636",
                "message": "UL INFO",
                "modem": "1-1.4"
            }
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 10000
        })
        reply.code(200).send({
            success: true
        })
    } catch (error) {
        reply.code(400).send(error)
    }   
}