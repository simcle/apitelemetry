import { getAllTelemetry } from "../controllers/customController.js";

export default async function (fastify, opts) {
    fastify.get('/telemetry/:companyId', getAllTelemetry)
}