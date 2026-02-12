import SensorModel from "../models/sensorModel.js";
import mongoose from "mongoose";


export const getAllTelemetry = async (req, res) => {
    
    const companyId = new mongoose.Types.ObjectId(`${req.params.companyId}`)
    const datas = await SensorModel.aggregate([
        {
            $match: {companyId: companyId}
        },
        {
            $lookup: {
                from: 'thresholdlevels',
                foreignField: 'deviceId',
                localField: '_id',
                as: 'threshold'
            }
        },
        { 
            $lookup: {
                from: 'loggerdatas',
                let: {'deviceId': '$_id'},
                pipeline: [
                    {
                        $match: {
                            $expr: {$eq: ['$deviceId', '$$deviceId']}
                        }
                    },
                    {
                        $sort: { createdAt: -1}
                    },
                    {
                        $limit: 1
                    }
                ],
                as: 'logger'
            }
        },
        {
            $unwind: {path: '$logger', preserveNullAndEmptyArrays: true}
        },
        {
            $project: {
                _id: 0,
                nama_lokasi: '$serialNumber',
                nama_alat: '$name',
                ReceivedDate: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$logger.timestamp",
                        timezone: "Asia/Jakarta"
                    }
                },
                ReceivedTime: {
                    $dateToString: {
                        format: "%H:%M:%S",
                        date: "$logger.timestamp",
                        timezone: "Asia/Jakarta"
                    }
                },
                Rain: "0",
                WLevel: {$toString: '$logger.level'},
                Lat: { $toString: { $arrayElemAt: ['$location.coordinates', 0] } },
                Lng: { $toString: { $arrayElemAt: ['$location.coordinates', 1] } },
                id_tipe: "PDA",
                id_merk: "SATCOMM",
                debit: {$toString: '$logger.instantTraffic'},
                siaga4: {
                    $toString: {
                        $first: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$threshold',
                                        as: 't',
                                        cond: { $eq: ['$$t.name', 'AMAN'] }
                                    }
                                },
                                as: 'a',
                                in: '$$a.min'
                            }
                        }
                    }
                },

                siaga3: {
                    $toString: {
                        $first: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$threshold',
                                        as: 't',
                                        cond: { $eq: ['$$t.name', 'WASPADA'] }
                                    }
                                },
                                as: 'w',
                                in: '$$w.min'
                            }
                        }
                    }
                },

                siaga2: {
                    $toString: {
                        $first: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$threshold',
                                        as: 't',
                                        cond: { $eq: ['$$t.name', 'SIAGA'] }
                                    }
                                },
                                as: 's',
                                in: '$$s.min'
                            }
                        }
                    }
                },

                siaga1: {
                    $toString: {
                        $first: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$threshold',
                                        as: 't',
                                        cond: { $eq: ['$$t.name', 'AWAS'] }
                                    }
                                },
                                as: 'x',
                                in: '$$x.min'
                            }
                        }
                    }
                },
                status: '$logger.status',
                nilai_a: "0.0000",
                nilai_b: "0.0000",
                nilai_c: "0.0000",
                kalibrasi: "0"
            }
        }
    ])
    

    const cilicis = []

    for(let data of datas) {
        console.log(data)
    }
    return res.code(200).send(datas)
}
