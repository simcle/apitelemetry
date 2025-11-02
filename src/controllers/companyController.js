import companyModel from "../models/companyModel.js";
import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";

export const registerCompany = async (request, reply) => {
    try {
        const { company, name, email , password } = request.body
        const compExists = await companyModel.findOne({name: company})
        const userExists = await userModel.findOne({email})
        
        if(!compExists && !userExists) {

            const compData = new companyModel({
                name: company
            })
    
            const comp = await compData.save()
            const companyId = comp._id
            const hashed = await bcrypt.hash(password, 10)
            const user = new userModel({
                name,
                email,
                password: hashed,
                companyId: companyId
            })
            await user.save()
            return reply.code(201).send({
                success: true,
                message: 'User registered successfully'
            });
        }

        if(compExists && !userExists) {
            const hashed = await bcrypt.hash(password, 10)
            const user = new userModel({
                name,
                email,
                password: hashed,
                companyId: compExists._id
            })
            await user.save()
            return reply.code(201).send({
                success: true,
                message: 'User registered successfully'
            });
        }

        if(compExists && userExists) {
            return reply.code(500).send({
                success: false,
                message: 'company & users alredy existing'
            })
        }
        
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: 'Internal Server Error'
        });
    }
}

export const updateCompany = async (request, reply) => {
    try {
        const { id } = request.params
        const update = request.body
        const updateComapny = await companyModel.findByIdAndUpdate(
            id,
            {$set: update},
            {new: true, runValidators: true}
        )

        if (!updateComapny) {
            return reply.code(404).send({
                success: false,
                message: 'Unor not found'
            });
        }
        return reply.code(200).send({
            success: true,
            message: 'Unor updated successfully',
            data: updateComapny
        });
    } catch (error) {
        reply.code(500).send({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}