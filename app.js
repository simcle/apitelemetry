import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import path from 'path'
import fromBody from '@fastify/formbody'
import cors from '@fastify/cors'
import dotenv from 'dotenv'
import db from './src/plugins/db.js'
import jwtAuth from './src/plugins/jwtAuth.js'
import { startMqttClinet } from './src/plugins/mqttClient.js'

import companyRoutes from './src/routes/companyRoutes.js'
import userRoutes from './src/routes/userRoutes.js'
import ptzRoutes from './src/routes/ptzRoutes.js'
import sensorRoutes from './src/routes/sensorRoutes.js'
import thresholdRoutes from './src/routes/thresholdRoutes.js'
import loggerRoutes from './src/routes/loggerRoutes.js'
import mobileUsageRoutes from './src/routes/mobileUsageRoutes.js'
import alertRoutes from './src/routes/alertRoutes.js'
import smsRoutes from './src/routes/smsRoutes.js'

dotenv.config()
const fastify = Fastify({
    logger: true
})

await fastify.register(cors, {
    origin: '*',
    methods: ['GET','PUT','POST','DELETE','OPTIONS']
})
fastify.addContentTypeParser('application/xml', { parseAs: 'string' }, function (req, body, done) {
  done(null, body)
})
fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), 'public'),
  prefix: '/',
})
await fastify.register(db)
await fastify.register(jwtAuth)
await fastify.register(fromBody)

startMqttClinet(fastify)

await fastify.register(userRoutes, {prefix: '/api/auth'})
await fastify.register(ptzRoutes, {prefix: '/api'})
await fastify.register(sensorRoutes, {prefix: '/api'})
await fastify.register(thresholdRoutes, {prefix: '/api'})
await fastify.register(loggerRoutes, {prefix: '/api'})
await fastify.register(mobileUsageRoutes, {prefix: '/api'})
await fastify.register(alertRoutes, {prefix: '/api'})
await fastify.register(smsRoutes, {prefix: '/api'})
await fastify.register(companyRoutes, {prefix: '/api'})

fastify.get('/', async (request, reply) => {
    return {message: 'Backend api'}
})

fastify.listen({port: process.env.PORT || 3000, host: '0.0.0.0'}, (err) => {
    if(err) {
        fastify.log.error(err)
        process.exit(1)
    }
})