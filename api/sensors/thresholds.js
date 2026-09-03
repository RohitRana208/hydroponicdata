// api/sensors/thresholds.js — Native MongoDB Driver for Vercel Serverless
const { MongoClient } = require('mongodb')

let cachedClient = null
const getDb = async () => {
  if (cachedClient) return cachedClient.db('hydrocore')
  const uri = process.env.MONGO_URI || "mongodb+srv://devansh:devansh@cluster0.tlrcezo.mongodb.net/hydrocore?retryWrites=true&w=majority&appName=Cluster0"
  cachedClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
  await cachedClient.connect()
  return cachedClient.db('hydrocore')
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const db = await getDb()
    const collection = db.collection('thresholdsettings')

    if (req.method === 'GET') {
      const doc = await collection.findOne({ _id: 'global' })
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
      await collection.updateOne(
        { _id: 'global' },
        { $set: { thresholds, updatedAt: new Date() } },
        { upsert: true }
      )
      return res.status(200).json({ success: true, message: 'Thresholds saved' })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
