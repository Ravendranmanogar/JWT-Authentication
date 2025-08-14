// const express = require('express')
// const app = express()
// require('dotenv').config()
import dotenv from 'dotenv';
dotenv.config();

import express from 'express'

import authRouter from './routes/authRoutes.js'

import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express()
import connectdb from './config/db.js'
import userRouter from './routes/userRoutes.js';
const port = process.env.PORT || 4000
connectdb();


app.use(express.json())
app.use(cookieParser())
//app.use(core({credential s:true}))

app.get('/',(req,res)=>{res.send("API working")})
app.use('/api/auth',authRouter)
app.use('/api/user',userRouter)

app.listen(port, ()=>console.log(`Server started on port: ${port}`));
