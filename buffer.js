import eventBus from "./event.js"
import { insertLogger } from "./controller.js"

const buffer = new Map()

const device = {}
eventBus.on('status', (data) => {
	device['cleintId'] = data.clientid
	device['status'] = data.status
})

export const addTobuffer = (serialNumber, data) => {
    buffer.set(serialNumber, data)
}

export const flushBufferToDB = async () => {
	for (const [serialNumber, latestData] of buffer.entries()) {
		try {
			if(device?.cleintId == serialNumber && device?.status == 'online') {
				await isOnline(serialNumber, latestData)
			} else if(device?.clientid == serialNumber && device?.status == 'offline') {
				await isOffline(serialNumber, latestData)
			} else {
				await isOnline(serialNumber, latestData)
			}
			
			console.log(`✅ Flushed data for ${serialNumber}`);
		} catch (err) {
			console.error(`❌ Error saving for ${serialNumber}:`, err.message);
		}
	}
	buffer.clear(); // kosongkan buffer setelah simpan
};



const isOnline =  async (serialNumber, latestData) => {
	await insertLogger(latestData)
	eventBus.emit('chart', latestData)
}

const isOffline = async (serialNumber, latestData) => {
	latestData.serialNumber = serialNumber
	latestData.waterLevel = 0
	latestData.timestamp = new Date()
	await insertLogger(latestData)
}
