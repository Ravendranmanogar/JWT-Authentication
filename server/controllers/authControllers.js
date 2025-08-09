import bcrypt from 'bcryptjs' 
import userModel from "../models/userModel.js"
import jwt from 'jsonwebtoken';
const { JsonWebTokenError } = jwt;
import express from "express"
import transporter from '../config/nodeMailer.js';



export const register = async(req,res)=>{
    const{email,name,password}=req.body
    if(!name || !password || !email){
        return res.json({success:false,message:"Missing Details"})
    }
    try{
        const existingUser = await userModel.findOne({email})
        if(existingUser){
            return res.json({success:false,message:"User already existed"})
        }
        const hashedPassword = await bcrypt.hash(password,10)
        const user = new userModel({name,email,password:hashedPassword})
        await user.save()

        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'})
        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV === 'production',
            sameSite:process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge:7*24*60*60*1000
        });

        //sending email
        // const mailOptions ={
        //     from:process.env.SENDER_EMAIL,
        //     to:email,
        //     subject:'Welcome Eamil',
        //     text:`your account has been created with the email id: ${email}`
        // }
        const testEmail = async () => {
        try {
            const info = await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Successful Registered Email',
            text: `Welcome to our Application. Your email is ${email}`
        });
        console.log('Message sent: ', info.messageId);
        } 
        catch (err) {
            console.error('Send failed:', err.message);
        }
        };
        await testEmail();
        return res.json({success:true});
    }
    catch(error){
        return res.json({sucess:false,message:error.message})
    }
}

export const login = async(req,res)=>{
    const{email,password}=req.body
    if(!email || !password){
        return res.json({success:false,message:'MIssing Details'})
    }
    try{
        const user = await userModel.findOne({email})
        if(!user){
           return res.json({success:false,message:'Invalid Email'})
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
           return res.json({success:false,message:'Ivalid Password'})
        }
        const token =jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'})
        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV ==='production',
            sameSite:process.env.NODE_ENV ==='production' ? 'none' : 'strict',
            maxAge:7*24*60*60*1000,
        })
        return res.json({success:true})
    }
    catch(error){
        return res.json({success:false,message:error.message})
    }

}

export const logout = async(req,res)=>{
    try{
        res.clearCookie('token',{
            httpOnly:true,
            secure:process.env.NODE_ENV ==='production',
            sameSite:process.env.NODE_ENV ==='production' ? 'none' : 'strict',
        })
        return res.json({success:true,message:'Logged out'})
    }
    catch(error){
        return res.json({success:false,message:error.message})
    }
}

export const sendVerifyOtp = async(req,res)=>{
    try{
        const userId  = req.userId;
        const user = await userModel.findById(userId);
        if(userId.isAccountVerified){
            return res.json({success:false,message:'Account is already verified'})
        }
        const otp = String(Math.floor(100000 + Math.random()* 900000))
        user.verifyOtp = otp;
        //user.verifyOtpExpireAt = Date.now()+24*60*60*1000;
        user.verifyOtpExpireAt = Date.now() + 5 * 60 * 1000; 
        await user.save();
    
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            text: `Your OTP is ${otp}. verify your account using this OTP`
        }
        await transporter.sendMail(mailOption);
        return res.json({success:true,message:'Verification OTP sent on email'})
    }catch(error){
        return res.json({success:false,message:error.message})
    }
}
//check the user verify email
export const verifyEmail =async (req,res)=>{
    //const {userId,otp}=req.body;
    const { otp } = req.body;
    const userId = req.userId;
    if(!userId || !otp){
        return res.json({success:false,message:'Missing Detials'})
    }
    try{
        const user = await userModel.findById(userId);
        if(!user){
            return res.json({success:false,message:'User Not Found'})
        }
        if(user.verifyOtp === '' || user.verifyOtp!== otp){
            return res.json({success:false,message:'Invalid Otp'})
        }
        if(user.verifyOtpExpireAt<Date.now()){
            return res.json({success:false,message:'Otp Expired'})
        }
        user.isAccountVerified = true;
        user.verifyOtp= ' ';
        user.verifyOtpExpireAt=0;
        await user.save();
        return res.json({success:true,message:'Email verified Successfully'})
    }catch(error){
        return res.json({success:false,message:error.message})
    }
}
//check is user is authenticated
export const isAuthenticated = async(req,res)=>{
    try{
        return res.json({success:true,})
    }catch(error){
        return res.json({success:false,message:error.message})
    }
}

export const sendResetOtp = async(req,res)=>{
    const{email}=req.body;
    if(!email){
        return res.json({success:false,message:"Email is required"})
    }
    try{
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success:false,message:"User not found"})
        }
        const otp = String(Math.floor(100000 * Math.random()*900000));
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now()+ 15*60*1000;
        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP for resetting your password is ${otp}. Use this OTP to reset your Password`
        }
        await transporter.sendMail(mailOption);
        return res.json({success:true,message:'Verification OTP sent on email'})
    }catch(error){
        return res.json({success:false,message:error.message})
    }
}

export const resetPassword = async(req,res)=>{
    const{email,otp,newPassword} = req.body;
    if(!email || !otp || !newPassword){
        return res.json({sucess:false,message:"Email, OTP, NewPassword is required"})
    }
    try{
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success:false,message:'User Not found'})
        }
        if(user.resetOtp === '' || user.resetOtp!==otp){
            return res.json({success:false,message:'Invalid OTP'})
        }
        if(user.resetOtpExpireAt<Date.now()){
            return res.json({success:false,message:'OTP Expired'})
        }
        const hashedPassword = await bcrypt.hash(newPassword,10);

        user.password = hashedPassword;
        user.resetOtp='';
        user.resetOtpExpireAt=0;
        await user.save();
        return res.json({success:true,message:'Password has reset successfully'})
    }catch(error){
        return res.json({success:false,message:error.message})
    }
}