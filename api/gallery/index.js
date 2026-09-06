// api/gallery/index.js — Vercel Serverless Function to fetch/manage Gallery Images
import { MongoClient, ObjectId } from 'mongodb'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY    || process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET,
  secure:     true,
})

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const db = await getDb()
    const collection = db.collection('galleryimages')

    // ── GET /api/gallery ─────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const limit = Math.min(parseInt(req.query.limit) || 40, 100)
      const images = await collection
        .find({})
        .sort({ capturedAt: -1, createdAt: -1 })
        .limit(limit)
        .toArray()

      return res.status(200).json(images)
    }

    // ── POST /api/gallery (Manual test upload or simulated snapshot) ──────────
    if (req.method === 'POST') {
      let body = req.body
      if (typeof body === 'string') {
        try { body = JSON.parse(body) } catch (_) {}
      }
      body = body || {}

      if (!body.imageUrl) {
        return res.status(400).json({ error: 'imageUrl or image base64 required' })
      }

      const doc = {
        imageUrl: body.imageUrl,
        publicId: body.publicId || null,
        capturedAt: body.capturedAt ? new Date(body.capturedAt) : new Date(),
        device: body.device || 'ESP32-S3-CAM',
        sizeBytes: Number(body.sizeBytes || 0),
        resolution: body.resolution || 'VGA (640x480)',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await collection.insertOne(doc)
      return res.status(201).json({ success: true, id: result.insertedId, doc })
    }

    // ── DELETE /api/gallery?id=... ───────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: 'Image id required' })

      let query = {}
      try {
        query._id = new ObjectId(id)
      } catch (_) {
        query._id = id
      }

      const existing = await collection.findOne(query)
      if (!existing) {
        return res.status(404).json({ error: 'Image not found' })
      }

      // If stored on Cloudinary, optionally remove it
      if (existing.publicId) {
        try {
          await cloudinary.uploader.destroy(existing.publicId)
        } catch (_) {}
      }

      await collection.deleteOne(query)
      return res.status(200).json({ success: true, message: 'Image deleted' })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    console.error('[Gallery API Error]', err)
    return res.status(500).json({ error: 'Gallery API failed', details: err.message })
  }
}
