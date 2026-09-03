// api/index.js — Vercel Serverless Function Express App (ES Modules)
import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'

const app = express()

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }))
app.use(express.json())

let cachedClient = null
const getDb = async () => {
  if (cachedClient) return cachedClient.db('hydrocore')
  const uri = process.env.MONGO_URI || "mongodb+srv://devansh:devansh@cluster0.tlrcezo.mongodb.net/hydrocore?retryWrites=true&w=majority&appName=Cluster0"
  cachedClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
  await cachedClient.connect()
  return cachedClient.db('hydrocore')
}

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'NutriFlow Vercel Express API v1.0', time: new Date() })
})

// ── POST sensor data (ESP32) ──────────────────────────────────────────────────
app.post('/api/sensors/data', async (req, res) => {
  try {
    const db = await getDb()
    const collection = db.collection('sensorreadings')

    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch (_) {}
    }
    body = body || {}

    const doc = {
      ph:         Number(body.ph ?? 7.0),
      tds:        Number(body.tds ?? 300),
      waterTemp:  Number(body.waterTemp ?? 25.0),
      airTemp:    Number(body.airTemp ?? 28.0),
      humidity:   Number(body.humidity ?? 60),
      waterLevel: Number(body.waterLevel ?? 15.0),
      createdAt:  new Date(),
      updatedAt:  new Date(),
    }

    const result = await collection.insertOne(doc)
    return res.status(201).json({
      success: true,
      id: result.insertedId,
      message: 'Data saved successfully to MongoDB Atlas',
    })
  } catch (err) {
    console.error('[Vercel Express Error]', err)
    return res.status(500).json({ error: 'Database error', details: err.message })
  }
})

// ── GET latest sensor reading ─────────────────────────────────────────────────
app.get('/api/sensors/latest', async (req, res) => {
  try {
    const db = await getDb()
    const latest = await db.collection('sensorreadings').findOne({}, { sort: { createdAt: -1 } })
    if (!latest) return res.status(404).json({ error: 'No sensor data found' })
    return res.status(200).json(latest)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// ── GET sensor history ────────────────────────────────────────────────────────
app.get('/api/sensors/history', async (req, res) => {
  try {
    const db = await getDb()
    const limit = Math.min(parseInt(req.query.limit) || 30, 200)
    const docs = await db.collection('sensorreadings').find({}).sort({ createdAt: -1 }).limit(limit).toArray()
    return res.status(200).json(docs.reverse())
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// ── GET & POST thresholds ─────────────────────────────────────────────────────
app.get('/api/sensors/thresholds', async (req, res) => {
  try {
    const db = await getDb()
    const doc = await db.collection('thresholdsettings').findOne({ _id: 'global' })
    if (!doc) {
      return res.status(200).json({
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
    return res.status(200).json({ thresholds: doc.thresholds, updatedAt: doc.updatedAt })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

app.post('/api/sensors/thresholds', async (req, res) => {
  try {
    const db = await getDb()
    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch (_) {}
    }
    body = body || {}

    const { thresholds } = body
    if (!thresholds) return res.status(400).json({ error: 'thresholds field required' })
    await db.collection('thresholdsettings').updateOne(
      { _id: 'global' },
      { $set: { thresholds, updatedAt: new Date() } },
      { upsert: true }
    )
    return res.status(200).json({ success: true, message: 'Thresholds saved' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

export default app
