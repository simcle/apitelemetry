import LoggerModel from './logger.js'
import SensorModel from './sensor.js'
import SmsModel from './sms.js'
import MobileUsageModel from './mobileUsage.js'
import AlertModel from './alert.js'
import eventBus from './event.js'
import WaterLevelCategoryModel from './waterLevelCategory.js'
import axios from 'axios'
import dayjs from 'dayjs'
import 'dayjs/locale/id.js'
dayjs.locale('id')

export const getQuota = async (req, res) => {
    try {
        const authLogin = {
            "username": "admin",
            "password": "Admin@19284637"
        }
        const url = 'http://192.168.2.1/api'

        const login = await axios.post(`${url}/login`, authLogin, {timeout: 5000})
        
        const token = login.data.data.token
        const data = await axios.post(`${url}/messages/actions/send`, {
            "data": {
                "number": "3636",
                "message": "UL INFO",
                "modem": "3-1"
            }
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 10000
        })
        res.status(200).json('OK')
    } catch (error) {
        res.status(400).send('error') 
    }
}


export const insertSensor = async (req, res) => {
    const data = req.body
    try {
        const result = await SensorModel.create(data)
        res.status(200).json(result)
    } catch (error) {
        res.status(400).send(error)
    }
}

export const getSensor = async (req, res) => {
    try {
        const data = await SensorModel.findOne()
        res.status(200).json(data) 
    } catch (error) {
        res.status(400).send(error)
    }
}

export const updateSensor = async (payload) => {
    try {
        const serialNumber = payload?.clientid
        const status = payload?.status == 'online' ? true : false
        await SensorModel.updateOne({serialNumber: serialNumber}, {status: status})
    } catch (error) {
        
    }
}
export const insertLogger = async (payload) => {
    try {
        const level = parseFloat(payload.waterLevel)
        const alert = await WaterLevelCategoryModel.findOne({
            min: { $lte: level },
            max: { $gte: level }
        })
       
        payload.status = alert?.name || null
        if(alert && alert?.name !== 'AMAN') {
            const data = {
                serialNumber: payload.serialNumber,
                type: alert.name,
                color: alert.color,
                message: alert.message,
                level: level,
                timestamp: payload.timestamp

            }
            await AlertModel.create(data)
            eventBus.emit('alert', data)
            sendSMSNotification(data)
        }
        await LoggerModel.create(payload)
    } catch (error) {
        console.log(error)   
    }
}

let alertLevel;

const sendSMSNotification = async (alert) => {
    if(alertLevel !== alert.type) {
        const phoneGroups = ['+6285316655882', '+6285217453399']
        alertLevel = alert.type
        const authLogin = {
            "username": "admin",
            "password": "Admin@19284637"
        }

        const url = 'http://192.168.2.1/api'
        try {
            const login = await axios.post(`${url}/login`, authLogin, {timeout: 5000})
            const token = login.data.data.token
            const message = `${alert.type} Lokasi - Katulampa; ketinggian air - ${alert.level}; Waktu - ${dayjs(alert.timestamp).format('DD/MM/YY hh:mm')}; ${alert.message}`
            console.log(message)
            for (let phone of phoneGroups) {
                await axios.post(`${url}/messages/actions/send`, {
                    "data": {
                        "number": `${phone}`,
                        "message": `${message}`,
                        "modem": "3-1"
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 5000
                })
            }
        } catch (error) {
            console.log(error)
        }
        
        
    }
}

export const getLogger = async (req, res) => {
    try {
        const data = await LoggerModel.find()
        res.status(200).json(data)
    } catch (error) {
        res.status(400).send(error)
    }
}

export const getWaterStats24Hours = async (req, res) => {
    const serialNumber = req.params.serialNumber
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const result = await LoggerModel.aggregate([
        {$match: {
            serialNumber,
            waterLevel: {$gt: 0},
            timestamp: {$gte: yesterday, $lte: now},
        }},
        {$group: {
            _id: null,
            maxWaterLevel: { $max: '$waterLevel' },
            minWaterLevel: { $min: '$waterLevel' },
            avgWaterLevel: { $avg: '$waterLevel' },
            lastWaterLevel: {$last: '$waterLevel'}
        }}
    ])
    res.status(200).json(result)
}

export const getWaterStatsByRagne = async (req, res) => {
    const serialNumber = req.params.serialNumber
    const range = req.query.range
    const now = new Date()
    let start 
    let query = {}
    switch (range) {
        case '1D': 
            start = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
            query = [
                {$match: {
                    serialNumber,
                    timestamp: {$gte: start, $lte: new Date()}
                }},
                {$sort: {createdAt: -1}}
            ]
            break;
        case '7D': 
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            query = [
                {$match: {
                    serialNumber,
                    timestamp: {$gte: start, $lte: new Date()}
                }},
                {$group: {
                    _id: {
                        $dateTrunc: {
                            date: "$createdAt",
                            unit: "minute",
                            binSize: 10,         // ✅ Setiap 10 menit
                            timezone: "Asia/Jakarta"
                        }
                    },
                    serialNumber: {$first: '$serialNumber'},
                    waterLevel: {$last: '$waterLevel'},
                    timestamp: {$last: '$timestamp'},
                    status: {$last: '$status'},
                    createdAt: {$last: '$createdAt'}
                }},
                {$sort: {createdAt: -1}}
            ]
            break;
        case '1B': 
            start = new Date(now.setMonth(now.getMonth() - 1))
            query = [
                {$match: {
                    serialNumber,
                    timestamp: {$gte: start, $lte: new Date()}
                }},
                {$group: {
                    _id: {
                        $dateTrunc: {
                            date: "$createdAt",
                            unit: "hour",
                            binSize: 1,         // ✅ Setiap 1 jam
                            timezone: "Asia/Jakarta"
                        }
                    },
                    serialNumber: {$first: '$serialNumber'},
                    waterLevel: {$last: '$waterLevel'},
                    timestamp: {$last: '$timestamp'},
                    status: {$last: '$status'},
                    createdAt: {$last: '$createdAt'}
                }},
                {$sort: {createdAt: -1}}
            ]
            break;
        case '3B': 
            start = new Date(now.setMonth(now.getMonth() - 3))
            query = [
                {$match: {
                    serialNumber,
                    timestamp: {$gte: start, $lte: new Date()}
                }},
                {$group: {
                    _id: {
                        $dateTrunc: {
                            date: "$createdAt",
                            unit: "hour",
                            binSize: 12,         // ✅ Setiap 12 Jam
                            timezone: "Asia/Jakarta"
                        }
                    },
                    serialNumber: {$first: '$serialNumber'},
                    waterLevel: {$last: '$waterLevel'},
                    timestamp: {$last: '$timestamp'},
                    status: {$last: '$status'},
                    createdAt: {$last: '$createdAt'}
                }},
                {$sort: {createdAt: -1}}
            ]
            break;
        case '1T':
            start = new Date(now.setMonth(now.getMonth() - 11))
            query = [
                {$match: {
                    serialNumber,
                    timestamp: {$gte: start, $lte: new Date()}
                }},
                {$group: {
                    _id: {
                        $dateTrunc: {
                            date: "$createdAt",
                            unit: "day",
                            binSize: 1,         // ✅ Setiap 1 hari
                            timezone: "Asia/Jakarta"
                        }
                    },
                    serialNumber: {$first: '$serialNumber'},
                    waterLevel: {$last: '$waterLevel'},
                    timestamp: {$last: '$timestamp'},
                    status: {$last: '$status'},
                    createdAt: {$last: '$createdAt'}
                }},
                {$sort: {createdAt: -1}}
            ]
    }
    try {
        const data = await LoggerModel.aggregate(query)
        res.status(200).json(data)
    } catch (error) {
        res.status(400).send(error)
    }
    
}

export const insertSMS = async (req, res) => {
    const payload = req.body
   
    try {
        const data = await SmsModel.create(payload)
        eventBus.emit('sms', data)
        res.status(200).json(data)
    } catch (error) {
        res.status(400).send(error)
    }
}

export const getSMS = async (req, res) => {
    try {
        const data = await SmsModel.find().sort({createdAt: -1})
        res.status(200).json(data)
    } catch (error) {
        res.status(400).send(error)
    }
}

export const insertMobileUsage = async (payload) => {
    try {
        await MobileUsageModel.create(payload)
    } catch (error) {
        console.log('error')
    }
}

export const getMobileUsage = async (req, res) => {
    try {
        const now = new Date();

        const startOfYesterday = new Date(now);
        startOfYesterday.setDate(now.getDate() - 1);
        startOfYesterday.setHours(0, 0, 0, 0);
        
        const endOfYesterday = new Date(now);
        endOfYesterday.setDate(now.getDate() - 1);
        endOfYesterday.setHours(23, 59, 59, 999);
        
        const start7d = new Date(startOfYesterday);
        start7d.setDate(startOfYesterday.getDate() - 6);
        
        const start30d = new Date(startOfYesterday);
        start30d.setDate(startOfYesterday.getDate() - 29);
        const date = new Date(endOfYesterday)
    
        const allUsage = await MobileUsageModel.aggregate([
            {
                $match: {
                serialNumber: '6003046092',
                createdAt: { $gte: start30d, $lte: endOfYesterday }
                }
            },
            {
                $facet: {
                    day: [
                        { $match: { createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } } },
                        {
                        $group: {
                            _id: null,
                            tx: { $sum: '$tx' },
                            rx: { $sum: '$rx' },
                        }
                        },
                        {
                        $addFields: {
                            total: { $add: ['$tx', '$rx'] }
                        }
                        }
                    ],
                    week: [
                        { $match: { createdAt: { $gte: start7d, $lte: endOfYesterday } } },
                        {
                        $group: {
                            _id: null,
                            tx: { $sum: '$tx' },
                            rx: { $sum: '$rx' },
                        }
                        },
                        {
                        $addFields: {
                            total: { $add: ['$tx', '$rx'] }
                        }
                        }
                    ],
                    month: [
                        {
                        $group: {
                            _id: null,
                            tx: { $sum: '$tx' },
                            rx: { $sum: '$rx' },
                        }
                        },
                        {
                        $addFields: {
                            total: { $add: ['$tx', '$rx'] }
                        }
                        }
                    ]
                }
            },
            {
                $project: {
                  yesterday: { $arrayElemAt: ['$day.total', 0] },
                  total7d: { $arrayElemAt: ['$week.total', 0] },
                  total30d: { $arrayElemAt: ['$month.total', 0] }
                }
            }
        ]);
        res.status(200).json(allUsage[0])
    } catch (error) {
        
    }
}

export const getAlert = async (req, res) => {
    try {
        const data = await AlertModel.aggregate([
            {$match: {serialNumber: '6003046092'}},
            {$sort: {timestamp: -1}},
            {$limit: 20}
        ])
        res.status(200).json(data)
    } catch (error) {
        res.status(400).send(error)
    }
}

export const getWaterlevelCategory = async(req, res) => {
    try {
        const data = await WaterLevelCategoryModel.find().sort({severity: 1})
        res.status(200).json(data)
    } catch (error) {
        res.status(400).send(error)
    }
}
eventBus.on('status', async (payload) => {
    const status = payload.status
    const serialNumber = payload.clientid 
    if(serialNumber == '6003046092') {
        
        if(status == 'online') {
            const data = await AlertModel.create({
                serialNumber: serialNumber,
                type: 'DEVICE ONLINE',
                color: 'text-green-500',
                message: 'Perangkat telah online dan terhubung ke server.',
                timestamp: new Date()
            })  
            eventBus.emit('alert', data) 
        }
        if(status == 'offline') {
            const data = await AlertModel.create({
                serialNumber: serialNumber,
                type: 'DEVICE OFFLINE',
                color: 'text-red-500',
                message: 'Perangkat tidak terhubung (OFFLINE) Kemungkinan gangguan jaringan, power supply, atau restart tidak normal.',
                timestamp: new Date()
            })
            eventBus.emit('alert', data)   
        }
    }
})

const insertWater = async () => {
    await WaterLevelCategoryModel.insertMany([
        {
            name: 'AMAN',
            min: 0,
            max: 200.49,
            color: 'text-green-500',
            message: 'Kondisi normal. Tidak ada ancaman banjir.',
            severity: 1
          },
          {
            name: 'WASPADA',
            min: 200.5,
            max: 399.99,
            color: 'text-yellow-500',
            message: 'Harap tingkatkan kewaspadaan. Posisi air mulai mengalami kenaikan.',
            severity: 2
          },
          {
            name: 'SIAGA',
            min: 400.0,
            max: 500.49,
            color: 'text-orange-500',
            message: 'Ketinggian air cukup tinggi. Siapkan mitigasi banjir dan peringatan dini.',
            severity: 3
          },
          {
            name: 'AWAS',
            min: 500.5,
            max: 1000,
            color: 'text-red-500',
            message: 'Ketinggian air berbahaya. Lakukan tindakan darurat!',
            severity: 4
          }
    ])
}

// insertWater()


