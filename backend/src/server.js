import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import connectDB from './config/db.js'
import authRoutes from './routes/auth.route.js'
import messageRoutes from './routes/message.route.js'
import { app,server } from './utils/socket.js'

dotenv.config()

const PORT = process.env.PORT || 5000

//middlewares
app.use(express.json())
app.use(cookieParser()) 
app.use(cors({
    origin:"http://localhost:3000",
    credentials:true
}))
//routes
app.use('/api/auth',authRoutes) 
app.use('/api/messages',messageRoutes)

const ConnectServer= ()=>{
    
    server.listen(PORT,async()=>{
        try {
            await connectDB()
            console.log(`Server connected to port ${PORT}`);
            
        } catch (error) {
            console.log('error:',error.message);
            
        }
    })
}
ConnectServer()
