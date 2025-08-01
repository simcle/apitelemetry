import { getWaterStats24Hours, getWaterStatsByRange } from "../controllers/loggerController.js";

export default async function (fastify, opts) {
    fastify.addHook('preHandler', fastify.verifyJwt)
    fastify.get('/logger/stat/:id', getWaterStats24Hours)
    fastify.get('/logger/:id', getWaterStatsByRange)
}