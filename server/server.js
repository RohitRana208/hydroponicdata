// ─────────────────────────────────────────────────────────────────────────────
// NutriFlow — Express Backend Server (ES Modules)
// ─────────────────────────────────────────────────────────────────────────────

import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import SensorReading from './models/SensorReading.js'
import ThresholdSetting from './models/ThresholdSetting.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
}))

app.use(express.json())

app.use((req, res, next) => {
  const time = new Date().toLocaleTimeString('en-IN', { hour12: false })
  console.log(`[${time}] ${req.method} ${req.path}`)
  next()
})

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log('✅ MongoDB connected:', mongoose.connection.host)
  } catch (err) {
    console.error('❌ MongoDB connection FAILED:', err.message)
    process.exit(1)
  }
}

app.get('/health', (req, res) => {
  res.json({
    status:   'ok',
    server:   'NutriFlow Intelligence v1.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time:     new Date().toISOString(),
  })
})

app.post('/api/sensors/data', async (req, res) => {
  try {
    const { ph, tds, waterTemp, airTemp, humidity, waterLevel } = req.body

    const reading = new SensorReading({
      ph:         ph !== undefined && ph !== null ? ph : 7.0,
      tds:        tds !== undefined && tds !== null ? tds : 300,
      waterTemp:  waterTemp !== undefined && waterTemp !== null ? waterTemp : 25.0,
      airTemp:    airTemp !== undefined && airTemp !== null ? airTemp : 28.0,
      humidity:   humidity !== undefined && humidity !== null ? humidity : 60,
      waterLevel: waterLevel !== undefined && waterLevel !== null ? waterLevel : 15.0,
    })

    await reading.save()
    console.log(`📡 Data saved | pH:${reading.ph} | TDS:${reading.tds}`)

    res.status(201).json({
      success: true,
      id:      reading._id,
      message: 'Data saved successfully',
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/sensors/latest', async (req, res) => {
  try {
    const latest = await SensorReading.findOne().sort({ createdAt: -1 }).lean()
    if (!latest) return res.status(404).json({ error: 'Koi data nahi mila' })
    res.json(latest)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/sensors/history', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 200)
    const data = await SensorReading.find().sort({ createdAt: -1 }).limit(limit).lean()
    res.json(data.reverse())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/sensors/thresholds', async (req, res) => {
  try {
    const doc = await ThresholdSetting.findById('global').lean()
    if (!doc) {
      return res.json({
        thresholds: {
          ph:         { min: 6.5,  max: 7.5,  unit: 'pH',  enabled: true },
          tds:        { min: 50,   max: 400,  unit: 'PPM', enabled: true },
          waterTemp:  { min: 18,   max: 28,   unit: '°C',  enabled: true },
          airTemp:    { min: 15,   max: 40,   unit: '°C',  enabled: false },
          humidity:   { min: 40,   max: 85,   unit: '%',   enabled: true },
          waterLevel: { min: 8,    max: 100,  unit: 'cm',  enabled: true },
        }
      })
    }
    res.json({ thresholds: doc.thresholds, updatedAt: doc.updatedAt })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/sensors/thresholds', async (req, res) => {
  try {
    const { thresholds } = req.body
    if (!thresholds) return res.status(400).json({ error: 'thresholds field required' })
    await ThresholdSetting.findByIdAndUpdate(
      'global',
      { thresholds },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    res.json({ success: true, message: 'Thresholds saved' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.use((req, res) => {
  res.status(404).json({ error: `Route "${req.path}" nahi mila` })
})

const startServer = async () => {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`\n🚀 NutriFlow Server chal raha hai on port ${PORT}!`)
  })
}

startServer()
