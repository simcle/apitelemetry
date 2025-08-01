import { getMobileUsage } from "../controllers/mobileUsageController.js";

export default async function (fastify, opts) {
    fastify.addHook('preHandler', fastify.verifyJwt)
    fastify.get('/mobile-usage/:id', getMobileUsage)
}