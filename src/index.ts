import express from 'express'                   
import cors from 'cors'     
import authRoutes from './routes/auth.routes'  
import itemRoutes from './routes/item.routes'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import profileRoutes from './routes/profile.routes'

dotenv.config()

const SERVER_PORT = process.env.SERVER_PORT
const MONGO_URI = process.env.MONGO_URI as string

const app = express()

// JSON parsing middleware
app.use(express.json())                         

// CORS middleware configuration
app.use(cors({
    origin: 'http://localhost:5173',            
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true 
}))              

// Mount auth routes, mekath middleware ekak
app.use('/api/v1/auth', authRoutes)     
app.use('/api/v1/items', itemRoutes)
app.use('/api/v1/', profileRoutes);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB")
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err)
    process.exit(1)
  })

app.listen(SERVER_PORT, () => {
  console.log('Server is running')
})


