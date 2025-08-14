import userModel from "../models/userModel.js";
import  {isAuthenticated}  from "../controllers/authControllers.js";

export const getUserData = async(req,res)=>{
    try{
        const userId = req.userId;
        const user = await userModel.findById(userId);
        if(!user){
            return res.json ({success:false,message:'User Mot Found'})
        }
        res.json({success:true,
            userData:{
                name:user.name,
                isAuthenticated:user.isAccountVerified
            }})
    }
    catch(error){
        return res.json({success:false,message:error.message})
    }
}