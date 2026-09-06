// api/camera/trigger.js — Native Vercel Function (ES Modules)
import { MongoClient } from 'mongodb'

let cachedClient = null
const getDb = async () => {
  if (cachedClient) return cachedClient.db('hydrocore')
  const uri = process.env.MONGO_URI || "mongodb+srv://devansh:devansh@cluster0.tlrcezo.mongodb.net/hydrocore?retryWrites=true&w=majority&appName=Cluster0"
  cachedClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 })
  await cachedClient.connect()
  return cachedClient.db('hydrocore')
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const db = await getDb()

    if (req.method === 'POST') {
      await db.collection('cameracontrol').updateOne(
        { _id: 'global_state' },
        { $set: { captureRequested: true, requestedAt: new Date() } },
        { upsert: true }
      )
      return res.status(200).json({
        success: true,
        message: 'Live snapshot requested. ESP32 will capture on next cycle.',
      })
    }

    const state = await db.collection('cameracontrol').findOne({ _id: 'global_state' })
    return res.status(200).json({
      captureRequested: state?.captureRequested || false,
      lastCapturedAt: state?.lastCapturedAt || null,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
