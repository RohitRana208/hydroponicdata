// api/sensors/data.js — Native Vercel Function (ES Modules)
import { MongoClient } from 'mongodb'

let cachedClient = null
const getDb = async () => {
  if (cachedClient) return cachedClient.db('hydrocore')
  const uri = process.env.MONGO_URI || "mongodb+srv://devansh:devansh@cluster0.tlrcezo.mongodb.net/hydrocore?retryWrites=true&w=majority&appName=Cluster0"
  cachedClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
  await cachedClient.connect()
  return cachedClient.db('hydrocore')
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' })
  }

  try {
    const db = await getDb()

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

    const result = await db.collection('sensorreadings').insertOne(doc)

    return res.status(201).json({
      success: true,
      id: result.insertedId,
      message: 'Data saved successfully to MongoDB Atlas',
    })
  } catch (err) {
    console.error('[Vercel API Error]', err)
    return res.status(500).json({ error: 'Database error', details: err.message })
  }
}
