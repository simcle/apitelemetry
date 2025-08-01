import { getAlertByDeviceId } from "../controllers/alertController.js";

export default async function (fastify, opts) {
    fastify.addHook('preHandler', fastify.verifyJwt)
    fastify.get('/alert/:id', getAlertByDeviceId)
}