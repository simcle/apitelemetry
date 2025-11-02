import userModel from "../models/userModel.js";
import companyModel from "../models/companyModel.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { pipeline } from "stream/promises";


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
        const user = await userModel.findOne({email}).populate('companyId')
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
            {userId: user._id, email: user.email, companyId: user.companyId._id}, process.env.JWT_SECRET, {expiresIn: '7d'}
        )
        return reply.send({
            success: true,
            user: user.name,
            userEmail: user.email,
            companyId: user.companyId._id,
            companyName: user.companyId.name,
            logo: user.companyId?.logo,
            token: token
        })
    } catch (error) {
        console.log(error)
        request.log.error(error);
        return reply.code(500).send({
        success: false,
        message: 'Internal Server Error'
        });
    }
}

export const getMe = async (request, reply) => {
    try {
        const userId = request.user.userId
        const user = await userModel.findById(userId).populate('companyId')
        return reply.send({
            success: true,
            user: user.name,
            userEmail: user.email,
            companyId: user.companyId._id,
            companyName: user.companyId.name,
            logo: user.companyId?.logo
        })
    } catch (error) {
        
    }
}

export const updateProfile = async (request, reply) => {
    const userId = request.user.userId
    const companyId = request.user.companyId
    const data = {}
    const uploadDir = path.join(process.cwd(), 'public/images')

    // Pastikan folder uploads ada
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
    }


    const parts = request.parts()
    try {
        for await (const part of parts) {
            if(part.file) {
                const filename = `${Date.now()}.png`
                const uploadPath = path.join('public/images', filename)
                const currentCompany = await companyModel.findById(companyId)
                if(currentCompany.logo) {
                    const oldLogoPath = path.join(process.cwd(), 'public', currentCompany.logo)
                    if (fs.existsSync(oldLogoPath)) {
                        fs.unlinkSync(oldLogoPath)
                    }
                }
                await pipeline(part.file, fs.createWriteStream(uploadPath))
                data.logo = `images/${filename}`
            } else {
                data[part.fieldname] = part.value
            }
        }
        if(data.logo) {
            await companyModel.findByIdAndUpdate(companyId, {
                $set: {name: data.company, logo: data.logo}
            })
        } else {
            await companyModel.findByIdAndUpdate(companyId, {
                $set: {name: data.company}
            })
        }
        if(data.password) {
            const hashed = await bcrypt.hash(data.password, 10)
            await userModel.findByIdAndUpdate(userId, {
                $set: {name: data.user, email: data.email, password: hashed}
            })
        } else {
            await userModel.findByIdAndUpdate(userId, {
                $set: {name: data.user, email: data.email}
            })
        }
        if(data.password) {
            delete data.password
        }
        return reply.send(data)
    } catch (error) {
        if(error.code = '11000' && error.keyPattern && error.keyValue) {
            const duplicateField = Object.keys(error.keyPattern)[0]
            const duplicateValue = error.keyValue[duplicateField]
            return reply.code(400).send({
                message: `Duplikat data pada field '${duplicateField}' dengan nilai '${duplicateValue}'`,
                field: duplicateField,
                value: duplicateValue
            })
        }
        return reply.code(500).send({
            message: 'Terjadi kesalahan pada server',
            error: error.message
        })
    }
}
