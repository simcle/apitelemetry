import MobileUsageModel from '../models/mobileUsage.js'

const lastValue = new Map()

export const addMobile = async (deviceId, data) => {
    const { tx, rx } = data
    const prev = lastValue.get(deviceId) || {tx:0, rx: 0}
    if(tx < prev.tx || rx < prev.rx) {
        const date = new Date().toISOString().split('T')[0]
        await MobileUsageModel.updateOne(
            {deviceId, date},
            {$set: {tx: prev.tx, rx: prev.rx}},
            {upsert: true}
        )
    }

    lastValue.set(deviceId, {tx, rx})
}