// api/sensors/history.js — CommonJS Vercel Serverless Function
const mongoose = require('mongoose')

let isConnected = false
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return
  const uri = process.env.MONGO_URI || "mongodb+srv://devansh:devansh@cluster0.tlrcezo.mongodb.net/hydrocore?retryWrites=true&w=majority&appName=Cluster0"
  const db = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  isConnected = db.connections[0].readyState === 1
}

const getSensorModel = () => {
  const sensorReadingSchema = new mongoose.Schema(
    { ph: Number, tds: Number, waterTemp: Number, airTemp: Number, humidity: Number, waterLevel: Number },
    { timestamps: true }
  )
  return mongoose.models.SensorReading || mongoose.model('SensorReading', sensorReadingSchema)
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    try {
      await connectDB()
    } catch (dbErr) {
      return res.status(500).json({ error: 'MongoDB Atlas connection failed', details: dbErr.message })
    }
    const SensorReading = getSensorModel()
    const limit = Math.min(parseInt(req.query.limit) || 30, 200)
    const data = await SensorReading.find().sort({ createdAt: -1 }).limit(limit).lean()
    return res.status(200).json(data.reverse())
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
