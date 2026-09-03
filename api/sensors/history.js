// api/sensors/history.js — Native Vercel Function (ES Modules)
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const db = await getDb()
    const limit = Math.min(parseInt(req.query.limit) || 30, 200)
    const docs = await db.collection('sensorreadings').find({}).sort({ createdAt: -1 }).limit(limit).toArray()
    return res.status(200).json(docs.reverse())
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
