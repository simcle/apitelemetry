import mongoose from 'mongoose'
import loggerModel from '../models/loggerModel.js'

export const getWaterStats24Hours = async (request, reply) => {
    const deviceId = new mongoose.Types.ObjectId(request.params.id)
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    try {
        const data = await loggerModel.aggregate([
            {$match: {
                deviceId: deviceId,
                level: {$gt: 0},
                timestamp: {$gte: yesterday, $lte: now}
            }},
            {$group: {
                _id: deviceId,
                maxWaterLevel: { $max: '$level' },
                minWaterLevel: { $min: '$level' },
                avgWaterLevel: { $avg: '$level' },
                lastWaterLevel: {$last: '$level'}
            }}
        ])
        return reply.code(200).send({
            success: true,
            data
        })
    } catch (error) {
        console.log(error)
    }
}

export const getWaterStatsByRange = async (request, reply) => {
    const deviceId = new mongoose.Types.ObjectId(request.params.id)
    const range = request.query.range
    const now = new Date()
    let start 
    let query = {}
    switch (range) {
        case '1D': 
        start = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
        query = [
            {$match: {
                deviceId: deviceId,
                timestamp: {$gte: start, $lte: new Date()}
            }},
            {$sort: {createdAt: -1}}
        ]
        break;
        case '7D': 
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            query = [
                {$match: {
                    deviceId: deviceId,
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
                    deviceId: {$first: '$deviceId'},
                    level: {$last: '$level'},
                    realTimeFlowRate: {$last: '$realTimeFlowRate'},
                    instantTraffic: {$last: '$instantTraffic'},
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
                    deviceId: deviceId,
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
                    deviceId: {$first: '$deviceId'},
                    level: {$last: '$level'},
                    realTimeFlowRate: {$last: '$realTimeFlowRate'},
                    instantTraffic: {$last: '$instantTraffic'},
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
                    deviceId: deviceId,
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
                    deviceId: {$first: '$deviceId'},
                    level: {$last: '$level'},
                    realTimeFlowRate: {$last: '$realTimeFlowRate'},
                    instantTraffic: {$last: '$instantTraffic'},
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
                    deviceId: deviceId,
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
                    deviceId: {$first: '$deviceId'},
                    level: {$last: '$level'},
                    realTimeFlowRate: {$last: '$realTimeFlowRate'},
                    instantTraffic: {$last: '$instantTraffic'},
                    timestamp: {$last: '$timestamp'},
                    status: {$last: '$status'},
                    createdAt: {$last: '$createdAt'}
                }},
                {$sort: {createdAt: -1}}
            ]
    }
    try {
        const data = await loggerModel.aggregate(query)
        return reply.code(200).send({
            message: 'success',
            data
        })
    } catch (error) {
        console.log(error)
    }
    
}