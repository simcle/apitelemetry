import fp from 'fastify-plugin'
import jwt from 'jsonwebtoken'

export default fp(async (fastify, opts) => {
    fastify.decorate('verifyJwt', async (request, reply) => {
        const authHeader = request.headers['authorization']
        if(!authHeader) {
            return reply.code(401).send({
                success: false,
                message: 'Unauthorized: No token'
            });
        }

        const token = authHeader.split(' ')[1]
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            request.user = decoded 
        } catch (error) {
            return reply.code(401).send({
                success: false,
                message: 'Unauthorized: Invalid token'
            });
        }
    })
})