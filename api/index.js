// api/index.js — Vercel Serverless Function for NutriFlow Backend
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const SensorReading = require('../server/models/SensorReading')
const ThresholdSetting = require('../server/models/ThresholdSetting')

const app = express()

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }))
app.use(express.json())

// Reuse MongoDB connection in Serverless environments
let isConnected = false
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return
  const uri = process.env.MONGO_URI || "mongodb+srv://devansh:devansh@cluster0.tlrcezo.mongodb.net/hydrocore?retryWrites=true&w=majority&appName=Cluster0"
  const db = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  })
  isConnected = db.connections[0].readyState === 1
}

app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err.message })
  }
})

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'NutriFlow Vercel Serverless API v1.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  })
})

// ── POST sensor data (ESP32 sends here) ──────────────────────────────────────
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
    console.log(`[Vercel Serverless] Data saved | TDS:${reading.tds}`)

    res.status(201).json({
      success: true,
      id: reading._id,
      message: 'Data saved successfully to MongoDB Atlas',
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET latest reading ───────────────────────────────────────────────────────
app.get('/api/sensors/latest', async (req, res) => {
  try {
    const latest = await SensorReading.findOne().sort({ createdAt: -1 }).lean()
    if (!latest) return res.status(404).json({ error: 'No data found' })
    res.json(latest)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET reading history ──────────────────────────────────────────────────────
app.get('/api/sensors/history', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 200)
    const data = await SensorReading.find().sort({ createdAt: -1 }).limit(limit).lean()
    res.json(data.reverse())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET thresholds ───────────────────────────────────────────────────────────
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

// ── POST thresholds ──────────────────────────────────────────────────────────
app.post('/api/sensors/thresholds', async (req, res) => {
  try {
    const { thresholds } = req.body
    if (!thresholds) return res.status(400).json({ error: 'thresholds field required' })

    await ThresholdSetting.findByIdAndUpdate(
      'global',
      { thresholds },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    res.json({ success: true, message: 'Thresholds saved successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = app
