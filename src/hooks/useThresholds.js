// src/hooks/useThresholds.js
// ─────────────────────────────────────────────────────────────────────────────
// Manages sensor alert thresholds calibrated for ideal Lettuce cultivation
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : ''

// Scientific parameters for high-yield Hydroponic Lettuce (Butterhead, Grand Rapids)
export const DEFAULT_THRESHOLDS = {
  ph:         { min: 5.5,  max: 6.5,  unit: 'pH',    label: 'pH Level',             enabled: true },
  tds:        { min: 450,  max: 750,  unit: 'PPM',   label: 'TDS (Nutrient Salts)', enabled: true },
  ec:         { min: 0.9,  max: 1.6,  unit: 'mS/cm', label: 'EC (Electrical Cond.)', enabled: true },
  waterTemp:  { min: 18.0, max: 23.0, unit: '°C',    label: 'Water Temperature',    enabled: true },
  airTemp:    { min: 18.0, max: 26.0, unit: '°C',    label: 'Air Temperature',      enabled: false },
  humidity:   { min: 50,   max: 75,   unit: '%',     label: 'Air Humidity',         enabled: true },
  waterLevel: { min: 10.0, max: 100,  unit: 'cm',    label: 'Water Reservoir',      enabled: true },
}

const loadSaved = () => {
  try {
    const raw = localStorage.getItem('nutriflow_thresholds_v2')
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_THRESHOLDS,
        ...parsed,
      }
    }
  } catch (_) {}
  return DEFAULT_THRESHOLDS
}

export const useThresholds = () => {
  const [thresholds, setThresholds] = useState(loadSaved)
  const [saving, setSaving]         = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const lastAlertTimes = useRef({})

  const getStatus = useCallback((key, value) => {
    const t = thresholds[key]
    if (!t || !t.enabled || value === undefined || value === null) return 'info'

    // Threshold breached
    if (value < t.min || value > t.max) {
      const now = Date.now()
      const lastSent = lastAlertTimes.current[key] || 0
      if (now - lastSent > 15000) {
        lastAlertTimes.current[key] = now
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`⚠️ NutriFlow Alert: ${t.label}`, {
              body: `${t.label} drifted to ${typeof value === 'number' ? value.toFixed(1) : value} ${t.unit} (Ideal lettuce range: ${t.min} - ${t.max} ${t.unit})`,
              icon: '/favicon.svg',
              tag: `nutriflow-${key}`,
              renotify: true
            })
          } catch (e) {
            console.error('Notification error', e)
          }
        }
      }
      return 'critical'
    }

    const range  = t.max - t.min
    const buffer = range * 0.1
    if (value < t.min + buffer || value > t.max - buffer) return 'warning'
    return 'normal'
  }, [thresholds])

  const updateThreshold = useCallback((key, field, value) => {
    setThresholds(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }, [])

  const saveThresholds = useCallback(async (customThresholds) => {
    const toSave = customThresholds || thresholds
    setSaving(true)
    setSaveStatus(null)

    localStorage.setItem('nutriflow_thresholds_v2', JSON.stringify(toSave))
    setThresholds(toSave)

    try {
      await axios.post(`${BASE_URL}/api/sensors/thresholds`, { thresholds: toSave })
      setSaveStatus('success')
    } catch (_) {
      setSaveStatus('offline')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }, [thresholds])

  const resetThresholds = useCallback(() => {
    setThresholds(DEFAULT_THRESHOLDS)
    localStorage.setItem('nutriflow_thresholds_v2', JSON.stringify(DEFAULT_THRESHOLDS))
  }, [])

  return {
    thresholds,
    getStatus,
    updateThreshold,
    saveThresholds,
    resetThresholds,
    saving,
    saveStatus,
  }
}
