// server/models/Gallery.js — Mongoose Schema for ESP32-S3 CAM Snapshots
import mongoose from 'mongoose'

const gallerySchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: [true, 'imageUrl is required'],
      trim: true,
    },
    publicId: {
      type: String,
      default: null,
      trim: true,
    },
    capturedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    device: {
      type: String,
      default: 'ESP32-S3-CAM',
      trim: true,
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    resolution: {
      type: String,
      default: 'VGA (640x480)',
    },
    notes: {
      type: String,
      default: 'Automated 15-min hydroponic canopy capture',
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.Gallery || mongoose.model('Gallery', gallerySchema)
