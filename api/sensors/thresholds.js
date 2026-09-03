// api/sensors/thresholds.js — Vercel Serverless Function (ES Modules)
import mongoose from 'mongoose'
import ThresholdSetting from '../../server/models/ThresholdSetting.js'

let isConnected = false
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return
  const uri = process.env.MONGO_URI || "mongodb+srv://devansh:devansh@cluster0.tlrcezo.mongodb.net/hydrocore?retryWrites=true&w=majority&appName=Cluster0"
  const db = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  isConnected = db.connections[0].readyState === 1
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    try {
      await connectDB()
    } catch (dbErr) {
      return res.status(500).json({ error: 'MongoDB Atlas connection failed', details: dbErr.message })
    }

    if (req.method === 'GET') {
      const doc = await ThresholdSetting.findById('global').lean()
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
    }

    if (req.method === 'POST') {
      let body = req.body
      if (typeof body === 'string') {
        try { body = JSON.parse(body) } catch (_) {}
      }
      body = body || {}

      const { thresholds } = body
      if (!thresholds) return res.status(400).json({ error: 'thresholds field required' })
      await ThresholdSetting.findByIdAndUpdate(
        'global',
        { thresholds },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      return res.status(200).json({ success: true, message: 'Thresholds saved' })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
