// api/sensors/data.cjs — CommonJS Vercel Serverless Function
const mongoose = require('mongoose')

const sensorReadingSchema = new mongoose.Schema(
  {
    ph:         { type: Number, required: true, default: 7.0 },
    tds:        { type: Number, required: true, default: 300 },
    waterTemp:  { type: Number, required: true, default: 25.0 },
    airTemp:    { type: Number, required: true, default: 28.0 },
    humidity:   { type: Number, required: true, default: 60 },
    waterLevel: { type: Number, required: true, default: 15.0 },
  },
  { timestamps: true }
)

const SensorReading = mongoose.models.SensorReading || mongoose.model('SensorReading', sensorReadingSchema)

let isConnected = false
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return
  const uri = process.env.MONGO_URI || "mongodb+srv://devansh:devansh@cluster0.tlrcezo.mongodb.net/hydrocore?retryWrites=true&w=majority&appName=Cluster0"
  const db = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 })
  isConnected = db.connections[0].readyState === 1
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST for sensor data.' })
  }

  try {
    try {
      await connectDB()
    } catch (dbErr) {
      console.error('[MongoDB Error]', dbErr.message)
      return res.status(500).json({ error: 'MongoDB Atlas connection failed', details: dbErr.message })
    }

    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch (_) {}
    }
    body = body || {}

    const { ph, tds, waterTemp, airTemp, humidity, waterLevel } = body

    const reading = new SensorReading({
      ph:         ph !== undefined && ph !== null ? Number(ph) : 7.0,
      tds:        tds !== undefined && tds !== null ? Number(tds) : 300,
      waterTemp:  waterTemp !== undefined && waterTemp !== null ? Number(waterTemp) : 25.0,
      airTemp:    airTemp !== undefined && airTemp !== null ? Number(airTemp) : 28.0,
      humidity:   humidity !== undefined && humidity !== null ? Number(humidity) : 60,
      waterLevel: waterLevel !== undefined && waterLevel !== null ? Number(waterLevel) : 15.0,
    })

    await reading.save()
    console.log(`[Vercel Function] Saved sensor reading. TDS: ${reading.tds}`)

    return res.status(201).json({
      success: true,
      id: reading._id,
      message: 'Data saved successfully to MongoDB Atlas',
    })
  } catch (err) {
    console.error('[Vercel Error]', err)
    return res.status(500).json({ error: 'Internal Server Error', details: err.message })
  }
}
