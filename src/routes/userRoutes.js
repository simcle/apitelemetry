import multipart from '@fastify/multipart'
import { registerUser, loginUser, getMe, updateProfile } from "../controllers/userController.js";

export default async function (fastify, opts) {
    fastify.register(multipart)
    fastify.post('/register', registerUser)
    fastify.post('/login', loginUser)
    
    fastify.get('/me', {
        preHandler: fastify.verifyJwt,
        handler: getMe
    })
    fastify.post('/update', {
        preHandler: fastify.verifyJwt,
        handler: updateProfile
    })
}