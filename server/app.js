// const express = require('express')
// const app = express()
// require('dotenv').config()
import express from 'express'
import dotenv from 'dotenv';
import authRouter from './routes/authRoutes.js'
dotenv.config();
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express()
import connectdb from './config/db.js'
const port = process.env.PORT || 4000
connectdb();

app.use(express.json())
app.use(cookieParser())
//app.use(core({credential s:true}))

app.get('/',(req,res)=>{res.send("API working")})
app.use('/api/auth',authRouter)

app.listen(port, ()=>console.log(`Server started on port: ${port}`));
