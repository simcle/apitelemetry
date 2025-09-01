
const deviceDataMap = new Map()

export const parseData = (deviceId, rawArray) => {
    // Langkah 1: Cek apakah deviceId sudah ada di Map
    if (!deviceDataMap.has(deviceId)) {
        deviceDataMap.set(deviceId, {
            level: 0,
            instantTraffic: 0,
            realTimeFlowRate: 0,
            panelSurya: { voltage: 0, current: 0, power: 0 },
            battery: { voltage: 0, current: 0, soc: 0, temperature: 0 },
            load: { voltage: 0, current: 0, power: 0 }
        })
    }
    // Langkah 2: Ambil lastData dari Map
    const lastData = deviceDataMap.get(deviceId)
   
    // Langkah 3: Transformasikan dan update lastData di Map
    const updatedData = transformMqttPayload(rawArray, lastData)
    deviceDataMap.set(deviceId, updatedData)
    // ⏺️ Gunakan updatedData
    return { deviceId, updatedData}
}

function transformMqttPayload(rawArray, lastData) {
  for (const item of rawArray) {
    const { name } = item
    let data = item.data

    // 🛡️ Parse stringified array jika perlu
    if (typeof data === 'string' && data.trim().startsWith('[')) {
      try {
        data = JSON.parse(data)
      } catch (err) {
        console.warn(`❌ Gagal parse data untuk ${name}:`, data)
        continue
      }
    }

    switch (name) {
      case 'level':
        if (parseFloat(data) !== 0)
          lastData.level = Number(parseFloat(data).toFixed(2))
        break

      case 'instantTraffic':
        if (parseFloat(data) !== 0)
          lastData.instantTraffic = Number(parseFloat(data).toFixed(2))
        break

      case 'realTimeFlowRate':
        if (parseFloat(data) !== 0)
          lastData.realTimeFlowRate = Number(parseFloat(data).toFixed(2))
        break

      case 'panel_surya':
        if (Array.isArray(data)) {
          const [v, c, p] = data.map(Number)
          if (v !== 0) lastData.panelSurya.voltage = v / 100
          if (c !== 0) lastData.panelSurya.current = c
          if (p !== 0) lastData.panelSurya.power = p
        }
        break

      case 'battery':
        if (Array.isArray(data)) {
          const [v, c] = data.map(Number)
          if (v !== 0) lastData.battery.voltage = v / 100
          if (c !== 0) lastData.battery.current = c / 100
        }
        break

      case 'battery_soc':
        if (parseFloat(data) !== 0)
          lastData.battery.soc = parseFloat(data)
        break

      case 'battery_temp':
        if (parseFloat(data) !== 0)
          lastData.battery.temperature = parseFloat(data) / 100
        break

      case 'load':
        if (Array.isArray(data)) {
          const [v, c, p] = data.map(Number)
          if (v !== 0) lastData.load.voltage = v / 100
          if (c !== 0) lastData.load.current = c
          if (p !== 0) lastData.load.power = p
        }
        break
    }
  }

  return { ...lastData }
}