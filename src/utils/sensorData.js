const sensorData = new Map()

export const addToMap = (deviceId, data) => {
    sensorData.set(deviceId.toString(), data)
}

export const getSensorMap = (deviceId) => {
    return sensorData.get(deviceId)
}

