import { ptzControl } from "../controllers/ptzController.js";

export default async function (fastify, opts) {
    fastify.addHook('preHandler', fastify.verifyJwt)
    fastify.put('/ptz/:ip', ptzControl)
}