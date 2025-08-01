import { getQuota, getSms, insertSms } from "../controllers/smsController.js";

export default async function (fastify, opts) {
    fastify.post('/sms', insertSms)
    fastify.get('/sms/:id', getSms)
    fastify.post('/sms/quota/:id', getQuota)
}