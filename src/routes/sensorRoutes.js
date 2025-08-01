import { getAllTelemetry, createTelemetry, getTelemetyById, updateTemeletryById } from "../controllers/sensorController.js";

export default async function (fastify, opts) {
    fastify.addHook('preHandler', fastify.verifyJwt)
    fastify.get('/telemetry/:id', getTelemetyById)
    fastify.get('/telemetry', getAllTelemetry)
    fastify.post('/telemetry', createTelemetry)
    fastify.put('/telemetry/:id', updateTemeletryById)
}