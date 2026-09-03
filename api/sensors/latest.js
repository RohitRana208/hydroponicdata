// api/sensors/latest.js — Native MongoDB Driver for Vercel Serverless
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const db = await getDb()
    const latest = await db.collection('sensorreadings').findOne({}, { sort: { createdAt: -1 } })
    if (!latest) return res.status(404).json({ error: 'No sensor data found' })
    return res.status(200).json(latest)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
