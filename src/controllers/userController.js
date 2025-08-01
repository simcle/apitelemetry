import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken'

// REGISTER
export const registerUser = async (request, reply) => {
    try {
        const { name, email, password } = request.body
        const exist = await userModel.findOne({email})
        if(exist) {
            return reply.code(400).send({
                success: false,
                message: 'Email already registered'
            })
        }
        const hashed = await bcrypt.hash(password, 10)
        const user = new userModel({
            name,
            email,
            password: hashed
        })
        await user.save()
        return reply.code(201).send({
            success: true,
            message: 'User registered successfully'
        });
        
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
            success: false,
            message: 'Internal Server Error'
        });
    }
}

// LOGIN
export const loginUser = async (request, reply) => {
    try {
        const { email, password } = request.body
        const user = await userModel.findOne({email})
        if (!user) {
            return reply.code(400).send({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const match = await bcrypt.compare(password, user.password)
        if (!match) {
            return reply.code(400).send({
                success: false,
                message: 'Invalid email or password'
            });
        }
        // Generate JWT
        const token = jwt.sign(
            {userId: user._id, email: user.email}, process.env.JWT_SECRET, {expiresIn: '1d'}
        )
        return reply.send({
            success: true,
            name: user.name,
            token: token
        })
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({
        success: false,
        message: 'Internal Server Error'
        });
    }
}
