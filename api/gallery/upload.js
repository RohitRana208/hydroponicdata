// api/gallery/upload.js — Vercel Serverless Function for ESP32-S3 CAM Raw Image Uploads
import { MongoClient } from 'mongodb'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary from environment variables
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

// Helper to read raw request stream into a Buffer
const getRawBody = async (req) => {
  return new Promise((resolve, reject) => {
    // If body is already parsed (e.g. string or buffer)
    if (Buffer.isBuffer(req.body)) {
      return resolve(req.body)
    }
    if (typeof req.body === 'string') {
      return resolve(Buffer.from(req.body, req.body.startsWith('data:') ? 'base64' : 'utf-8'))
    }

    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', (err) => reject(err))
  })
}

// Helper to upload buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'nutriflow_esp32_cam',
        resource_type: 'image',
        format: 'jpg',
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )
    uploadStream.end(buffer)
  })
}

export const config = {
  api: {
    bodyParser: false, // Disable automatic body parsing to receive raw image/jpeg binary stream from ESP32
  },
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-Id')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Send POST with image/jpeg binary payload.' })
  }

  try {
    const buffer = await getRawBody(req)

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'Empty image buffer received from ESP32 camera' })
    }

    let imageUrl = ''
    let publicId = null

    const hasCloudinary = Boolean(
      (process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME) &&
      (process.env.CLOUDINARY_API_KEY    || process.env.VITE_CLOUDINARY_API_KEY) &&
      (process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET)
    )

    if (hasCloudinary) {
      try {
        const result = await uploadToCloudinary(buffer)
        imageUrl = result.secure_url
        publicId = result.public_id
      } catch (cloudErr) {
        console.error('[Cloudinary Upload Error]', cloudErr)
        // Fallback to inline Base64 data URI if Cloudinary fails
        imageUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`
      }
    } else {
      // Direct Data URI storage (works instantly out-of-the-box before Cloudinary env vars are added)
      imageUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`
    }

    // Save metadata to MongoDB Atlas
    const db = await getDb()
    const doc = {
      imageUrl,
      publicId,
      capturedAt: new Date(),
      device: req.headers['x-device-id'] || 'ESP32-S3-CAM',
      sizeBytes: buffer.length,
      resolution: req.headers['x-resolution'] || 'VGA (640x480)',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('galleryimages').insertOne(doc)

    return res.status(201).json({
      success: true,
      id: result.insertedId,
      imageUrl: imageUrl.startsWith('data:') ? 'Stored as Data URI in MongoDB' : imageUrl,
      capturedAt: doc.capturedAt,
      sizeBytes: doc.sizeBytes,
      message: 'Snapshot successfully uploaded and recorded',
    })
  } catch (err) {
    console.error('[Gallery Upload Handler Error]', err)
    return res.status(500).json({ error: 'Failed to process camera upload', details: err.message })
  }
}
