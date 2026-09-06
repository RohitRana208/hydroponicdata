// src/hooks/usePlantCamera.js
import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

const BASE = ''

export const usePlantCamera = (addLog) => {
  const [latestPhoto, setLatestPhoto] = useState(null)
  const [gallery, setGallery]         = useState([])
  const [isLoading, setIsLoading]     = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  const prevPhotoIdRef               = useRef(null)

  // ── Fetch latest snapshot ──────────────────────────────────────────────────
  const fetchLatest = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/api/camera/latest`, { timeout: 8000 })
      if (res.data?.exists && res.data.image) {
        setLatestPhoto(res.data)
        if (prevPhotoIdRef.current && prevPhotoIdRef.current !== res.data._id) {
          addLog?.('info', `📸 New plant snapshot received (${res.data.sizeKB || 30} KB)`)
          setIsCapturing(false)
        }
        prevPhotoIdRef.current = res.data._id
      }
      setIsLoading(false)
    } catch (err) {
      console.error('Failed to fetch latest camera photo:', err)
      setIsLoading(false)
    }
  }, [addLog])

  // ── Fetch 48-hour history gallery ─────────────────────────────────────────
  const fetchGallery = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/api/camera/history?limit=60`, { timeout: 10000 })
      if (Array.isArray(res.data)) {
        setGallery(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch camera gallery:', err)
    }
  }, [])

  // ── Trigger on-demand snapshot ─────────────────────────────────────────────
  const triggerCapture = useCallback(async () => {
    setIsCapturing(true)
    addLog?.('info', '📡 Requested instant plant photo from ESP32-S3 CAM…')
    try {
      await axios.post(`${BASE}/api/camera/trigger`, { requestCapture: true }, { timeout: 6000 })
      // Poll rapidly for 20 seconds waiting for ESP32 to upload
      let attempts = 0
      const pollTimer = setInterval(async () => {
        attempts++
        await fetchLatest()
        await fetchGallery()
        if (attempts >= 10) {
          clearInterval(pollTimer)
          setIsCapturing(false)
        }
      }, 2500)
    } catch (err) {
      addLog?.('error', `Failed to request photo: ${err.message}`)
      setIsCapturing(false)
    }
  }, [addLog, fetchLatest, fetchGallery])

  // Initial load
  useEffect(() => {
    fetchLatest()
    fetchGallery()
  }, [fetchLatest, fetchGallery])

  // Periodic polling every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchLatest()
      fetchGallery()
    }, 30000)
    return () => clearInterval(timer)
  }, [fetchLatest, fetchGallery])

  return {
    latestPhoto,
    gallery,
    isLoading,
    isCapturing,
    triggerCapture,
    refreshGallery: fetchGallery,
  }
}
