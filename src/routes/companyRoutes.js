import { registerCompany } from "../controllers/companyController.js";

export default async function (fastify, opts) {
    fastify.post('/company/register', registerCompany)
}