// api/camera/upload.js — Native Vercel Function (ES Modules)
import { MongoClient } from 'mongodb'

let cachedClient = null
const getDb = async () => {
  if (cachedClient) return cachedClient.db('hydrocore')
  const uri = process.env.MONGO_URI || "mongodb+srv://devansh:devansh@cluster0.tlrcezo.mongodb.net/hydrocore?retryWrites=true&w=majority&appName=Cluster0"
  cachedClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 })
  await cachedClient.connect()
  return cachedClient.db('hydrocore')
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  try {
    const db = await getDb()
    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch (_) {}
    }
    body = body || {}

    let imageBase64 = body.image || ''
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing image payload' })
    }

    // Ensure data URI prefix
    if (!imageBase64.startsWith('data:image')) {
      imageBase64 = `data:image/jpeg;base64,${imageBase64}`
    }

    const doc = {
      image: imageBase64,
      trigger: body.trigger || 'auto_30min',
      sizeKB: Math.round((imageBase64.length * 0.75) / 1024),
      createdAt: new Date(),
    }

    const result = await db.collection('plantimages').insertOne(doc)

    // Reset pending capture request
    await db.collection('cameracontrol').updateOne(
      { _id: 'global_state' },
      { $set: { captureRequested: false, lastCapturedAt: new Date() } },
      { upsert: true }
    )

    // Auto-cleanup: Keep last 150 images to ensure storage is always optimal
    const count = await db.collection('plantimages').countDocuments()
    if (count > 150) {
      const oldestDocs = await db.collection('plantimages')
        .find({})
        .sort({ createdAt: 1 })
        .limit(count - 150)
        .project({ _id: 1 })
        .toArray()
      const idsToDelete = oldestDocs.map(d => d._id)
      await db.collection('plantimages').deleteMany({ _id: { $in: idsToDelete } })
    }

    return res.status(201).json({
      success: true,
      id: result.insertedId,
      message: 'Photo saved to MongoDB Atlas',
      sizeKB: doc.sizeKB,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Database upload error', details: err.message })
  }
}
