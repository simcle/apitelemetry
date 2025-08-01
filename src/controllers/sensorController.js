import sensorModel from '../models/sensorModel.js'


export const getTelemetyById = async (request, reply) => {
  const id = request.params.id

  try {
    let data

    if (!id || id === 'null' || id === 'undefined') {
      // Ambil data pertama jika id kosong/null
      data = await sensorModel.findOne().sort({ createdAt: 1 })
    } else {
      data = await sensorModel.findOne({ _id: id })
    }

    if (!data) {
      return reply.code(404).send({
        success: false,
        message: 'Data tidak ditemukan'
      })
    }

    return reply.code(200).send({
      success: true,
      data
    })
  } catch (error) {
    return reply.code(400).send({
      success: false,
      message: error.message || 'Gagal mengambil data'
    })
  }
}

export const createTelemetry = async (request, reply) => {
    try {
        const {name, serialNumber, logger, gsmNumber, cctvIp, location, sensorType } = request.body
        // Validasi manual contoh (opsional, bisa pakai schema validation)
        if (!serialNumber || !logger || !gsmNumber || !cctvIp || !location || !sensorType) {
            return reply.code(400).send({
                success: false,
                message: 'Missing required fields'
            });
        }
        const data = new sensorModel({
            name,
            serialNumber,
            cctvIp,
            logger,
            gsmNumber,
            location,
            sensorType
        });
        const saved = await data.save();

        return reply.code(201).send({
            success: true,
            message: 'Telemetry data saved',
            data: saved
        });
    } catch (error) {
        request.log.error(error);

        // Handling duplicate serialNumber
        if (error.code === 11000) {
            return reply.code(409).send({
                success: false,
                message: 'Serial number already exists',
                data: error
            });
        }

        return reply.code(500).send({
            success: false,
            message: 'Internal Server Error'
        });
    }
}

export const updateTemeletryById = async (request, reply) => {
    try {
        const { id } = request.params
        const update = request.body
         
        const updatedSensor = await sensorModel.findByIdAndUpdate(
            id,
            {$set: update},
            { new: true, runValidators: true }
        )
        if (!updatedSensor) {
            return reply.code(404).send({
                success: false,
                message: 'Sensor not found'
            });
        }

        reply.code(200).send({
            success: true,
            message: 'Sensor updated successfully',
            data: updatedSensor
        });

    } catch (error) {
        console.error('Update sensor error:', error);
        // Duplicate key error (e.g. serialNumber uniqueness)
        if (error.code === 11000) {
            return reply.code(409).send({
                success: false,
                message: 'Duplicate key error: serialNumber must be unique'
            });
        }
        reply.code(500).send({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
    

}

export const getAllTelemetry = async (request, reply) => {
    try {
        const data = await sensorModel.find().sort({name: 1})
        return reply.code(200).send({
            success: true,
            count: data.length,
            data
        })
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: 'Internal Server Error'
        });
    }
}

