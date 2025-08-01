import { registerUser, loginUser } from "../controllers/userController.js";

export default async function (fastify, opts) {
    fastify.post('/register', registerUser),
    fastify.post('/login', loginUser)
}