import MobileUsageModel from '../models/mobileUsage.js'
import mongoose from 'mongoose';
export const getMobileUsage = async (requsest, reply) => {
    const deviceId = new mongoose.Types.ObjectId(requsest.params.id)
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
                deviceId: deviceId,
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
        return reply.code(200).send({
            success: true,
            data: allUsage[0]
        })
    } catch (error) {
        
    }
}