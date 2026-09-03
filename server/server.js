// ─────────────────────────────────────────────────────────────────────────────
// HydroData — Express Backend Server
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config()
const express           = require('express')
const mongoose          = require('mongoose')
const cors              = require('cors')
const SensorReading     = require('./models/SensorReading')
const ThresholdSetting  = require('./models/ThresholdSetting')

const app  = express()
const PORT = process.env.PORT || 5000


// ── Middleware ────────────────────────────────────────────────────────────────

// CORS — React dashboard aur ESP32 dono se requests allow karta hai
app.use(cors({
  origin: '*',   // Production mein apni site ka URL daalo
  methods: ['GET', 'POST'],
}))

// JSON body parser
app.use(express.json())

// Request logger (console mein dikhega)
app.use((req, res, next) => {
  const time = new Date().toLocaleTimeString('en-IN', { hour12: false })
  console.log(`[${time}] ${req.method} ${req.path}`)
  next()
})

// ── MongoDB Connection ────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,   // 5 sec mein connect na ho to error
    })
    console.log('✅ MongoDB connected:', mongoose.connection.host)
  } catch (err) {
    console.error('❌ MongoDB connection FAILED:', err.message)
    console.error('   Kya MongoDB chal raha hai? → brew services start mongodb-community')
    process.exit(1)   // Server band ho jayega
  }
}

// ── ROUTES ────────────────────────────────────────────────────────────────────

// ── 1. Health Check ──────────────────────────────────────────────────────────
// GET /health → Browser mein check karo ki server chal raha hai
app.get('/health', (req, res) => {
  res.json({
    status:   'ok',
    server:   'HydroCore Intelligence v1.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time:     new Date().toISOString(),
  })
})

// ── 2. ESP32 Data Receive ────────────────────────────────────────────────────
// POST /api/sensors/data
// ESP32 yahan data bhejta hai har 3 second mein
// Body:  { ph, tds, waterTemp, airTemp, humidity, waterLevel }
app.post('/api/sensors/data', async (req, res) => {
  try {
    const { ph, tds, waterTemp, airTemp, humidity, waterLevel } = req.body

    // Sabhi fields present hain?
    const missing = ['ph', 'tds', 'waterTemp', 'airTemp', 'humidity', 'waterLevel']
      .filter(field => req.body[field] === undefined || req.body[field] === null)

    if (missing.length > 0) {
      return res.status(400).json({
        error:   'Missing fields',
        missing: missing,
        hint:    `Yeh fields chahiye: ${missing.join(', ')}`,
      })
    }

    // Database mein save karo
    const reading = new SensorReading({ ph, tds, waterTemp, airTemp, humidity, waterLevel })
    await reading.save()

    console.log(`📡 Data saved | pH:${ph} | TDS:${tds} | WTemp:${waterTemp}°C | ATemp:${airTemp}°C | Hum:${humidity}% | Level:${waterLevel}cm`)

    res.status(201).json({
      success: true,
      id:      reading._id,
      message: 'Data saved successfully',
    })

  } catch (err) {
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: err.message })
    }
    console.error('❌ Save error:', err.message)
    res.status(500).json({ error: 'Server error', details: err.message })
  }
})

// ── 3. Dashboard — Latest Reading ────────────────────────────────────────────
// GET /api/sensors/latest
// React dashboard yahan se latest sensor data fetch karta hai
app.get('/api/sensors/latest', async (req, res) => {
  try {
    const latest = await SensorReading
      .findOne()
      .sort({ createdAt: -1 })   // Sabse nayi reading
      .lean()                    // Plain JS object (faster)

    if (!latest) {
      return res.status(404).json({
        error: 'Koi data nahi mila',
        hint:  'Pehle ESP32 se data bhejo ya manually POST karo',
      })
    }

    res.json(latest)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 4. Dashboard — History (Charts ke liye) ──────────────────────────────────
// GET /api/sensors/history?limit=30
// Charts mein last N readings dikhane ke liye
app.get('/api/sensors/history', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 200)

    const data = await SensorReading
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    // Chronological order mein return karo (oldest first)
    res.json(data.reverse())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 5. Target pH Update ───────────────────────────────────────────────────────
// POST /api/sensors/target-ph
// Dashboard se pH target set karna
app.post('/api/sensors/target-ph', async (req, res) => {
  try {
    const { targetPh } = req.body

    if (targetPh === undefined || targetPh < 0 || targetPh > 14) {
      return res.status(400).json({ error: 'targetPh 0 se 14 ke beech hona chahiye' })
    }

    console.log(`🎯 Target pH set to: ${targetPh}`)

    // TODO: Yahan MQTT se ESP32 ko command bhej sakte ho
    // mqttClient.publish('hydrocore/target/ph', String(targetPh))

    res.json({ success: true, targetPh, message: `Target pH ${targetPh} set ho gaya` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 6. Stats / Summary ───────────────────────────────────────────────────────
// GET /api/sensors/stats
// Aaj ka average, min, max
app.get('/api/sensors/stats', async (req, res) => {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const stats = await SensorReading.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      {
        $group: {
          _id:          null,
          count:        { $sum: 1 },
          avgPh:        { $avg: '$ph' },
          avgTds:       { $avg: '$tds' },
          avgWaterTemp: { $avg: '$waterTemp' },
          avgAirTemp:   { $avg: '$airTemp' },
          avgHumidity:  { $avg: '$humidity' },
          minPh:        { $min: '$ph' },
          maxPh:        { $max: '$ph' },
          minTds:       { $min: '$tds' },
          maxTds:       { $max: '$tds' },
        },
      },
    ])

    if (!stats.length) {
      return res.json({ message: 'Aaj ka koi data nahi hai abhi tak' })
    }

    // Round karo 2 decimal places tak
    const s = stats[0]
    res.json({
      todayReadings: s.count,
      ph:  { avg: +s.avgPh.toFixed(2),  min: s.minPh, max: s.maxPh },
      tds: { avg: +s.avgTds.toFixed(1), min: s.minTds, max: s.maxTds },
      waterTemp: { avg: +s.avgWaterTemp.toFixed(1) },
      airTemp:   { avg: +s.avgAirTemp.toFixed(1)   },
      humidity:  { avg: +s.avgHumidity.toFixed(1)  },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// ── 7. GET Thresholds — ESP32 polls this every 30s ───────────────────────────
// GET /api/sensors/thresholds
app.get('/api/sensors/thresholds', async (req, res) => {
  try {
    const doc = await ThresholdSetting.findById('global').lean()
    if (!doc) {
      // Return defaults if not set yet
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

// ── 8. SET Thresholds — Dashboard saves here ──────────────────────────────────
// POST /api/sensors/thresholds
app.post('/api/sensors/thresholds', async (req, res) => {
  try {
    const { thresholds } = req.body
    if (!thresholds) return res.status(400).json({ error: 'thresholds field required' })

    // Upsert — single global document
    await ThresholdSetting.findByIdAndUpdate(
      'global',
      { thresholds },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    console.log('[Thresholds] Updated:', JSON.stringify(thresholds, null, 2))
    res.json({ success: true, message: 'Thresholds saved — ESP32 will sync on next poll' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route "${req.path}" nahi mila` })
})

// ── Start Server ──────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB()

  app.listen(PORT, () => {
    console.log('\n🚀 HydroData Server chal raha hai!')
    console.log(`   Local:       http://localhost:${PORT}`)
    console.log(`   Health:      http://localhost:${PORT}/health`)
    console.log(`   Latest:      http://localhost:${PORT}/api/sensors/latest`)
    console.log(`   History:     http://localhost:${PORT}/api/sensors/history?limit=30`)
    console.log(`   Stats:       http://localhost:${PORT}/api/sensors/stats`)
    console.log(`   Thresholds:  http://localhost:${PORT}/api/sensors/thresholds`)
    console.log('\n📡 ESP32 ka data wait kar raha hun...\n')
  })
}

startServer()

