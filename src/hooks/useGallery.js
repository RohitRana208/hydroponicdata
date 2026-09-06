// src/hooks/useGallery.js — SWR / Polling hook for ESP32-S3 CAM Gallery
import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

const GALLERY_POLL_MS = 30000 // Poll every 30 seconds for new 15-min camera uploads
const BASE = ''

export const useGallery = () => {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [autoPoll, setAutoPoll] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const prevCountRef = useRef(0)

  const fetchGallery = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${BASE}/api/gallery?limit=60`, { timeout: 10000 })
      const data = Array.isArray(res.data) ? res.data : []
      setImages(data)
      setLastRefreshed(new Date())
      prevCountRef.current = data.length
    } catch (err) {
      console.error('[Gallery Fetch Error]', err)
      setError(err.response?.data?.error || err.message || 'Failed to fetch gallery')
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [])

  // Initial fetch on mount
  useEffect(() => {
    fetchGallery(false)
  }, [fetchGallery])

  // Polling mechanism (Auto-refresh every 30 seconds)
  useEffect(() => {
    if (!autoPoll) return
    const interval = setInterval(() => {
      fetchGallery(true)
    }, GALLERY_POLL_MS)
    return () => clearInterval(interval)
  }, [autoPoll, fetchGallery])

  // Delete image
  const deleteImage = useCallback(async (id) => {
    try {
      await axios.delete(`${BASE}/api/gallery?id=${id}`)
      setImages(prev => prev.filter(img => img._id !== id))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // Add sample/mock snapshot for testing UI
  const addSampleSnapshot = useCallback(async (customUrl) => {
    const sampleImages = [
      'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
    ]
    const randomUrl = customUrl || sampleImages[Math.floor(Math.random() * sampleImages.length)]

    try {
      const res = await axios.post(`${BASE}/api/gallery`, {
        imageUrl: randomUrl,
        device: 'ESP32-S3-CAM',
        resolution: 'VGA (640x480)',
        capturedAt: new Date(),
        sizeBytes: 48200,
      })
      if (res.data?.doc) {
        setImages(prev => [res.data.doc, ...prev])
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  const latestImage = images.length > 0 ? images[0] : null
  const historicalImages = images.length > 1 ? images.slice(1) : []

  return {
    images,
    latestImage,
    historicalImages,
    loading,
    error,
    autoPoll,
    setAutoPoll,
    lastRefreshed,
    refetch: () => fetchGallery(false),
    deleteImage,
    addSampleSnapshot,
  }
}
