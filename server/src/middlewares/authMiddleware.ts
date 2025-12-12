import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma/prisma";
export interface AuthRequest extends Request{
    user?:any;
}
export const protect=async(req:AuthRequest,res:Response,next:NextFunction)=>{
    const authHeader =req.headers.authorization;
    if(!authHeader||!authHeader.startsWith("Bearer ")){
        return res.status(401).json({message:"Not authorized,no token"});
    }
    const token=authHeader.split(" ")[1];
    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET!)as{id:number};
        const user=prisma.user.findUnique({where:{id:decoded.id}});
        if(!user)return res.status(404).json({message:"User not Found"});
        req.user=user;
        next();
    }catch{
        res.status(401).json({message:"Token invalid"});
    }
};