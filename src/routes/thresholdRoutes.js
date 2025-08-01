import { createOrUpdateThreshold, getThresholdByDeviceId } from "../controllers/thresholdContoller.js";

export default async function (fastify, opts) {
    fastify.addHook('preHandler', fastify.verifyJwt)
    fastify.post('/threshold', createOrUpdateThreshold)
    fastify.get('/threshold/:id', getThresholdByDeviceId)
}