// src/hooks/useThresholds.js
// ─────────────────────────────────────────────────────────────────────────────
// Manages sensor alert thresholds and browser notifications.
// Saved in localStorage so they persist across page reloads.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : ''

export const DEFAULT_THRESHOLDS = {
  ph:         { min: 6.5,  max: 7.5,  unit: 'pH',    label: 'pH Level',             enabled: true },
  tds:        { min: 50,   max: 400,  unit: 'PPM',   label: 'TDS',                  enabled: true },
  ec:         { min: 0.5,  max: 3.5,  unit: 'mS/cm', label: 'EC (Electrical Cond.)', enabled: true },
  waterTemp:  { min: 18.0, max: 28.0, unit: '°C',    label: 'Water Temperature',    enabled: true },
  airTemp:    { min: 15.0, max: 40.0, unit: '°C',    label: 'Air Temperature',      enabled: false },
  humidity:   { min: 40,   max: 85,   unit: '%',     label: 'Air Humidity',         enabled: true },
  waterLevel: { min: 8.0,  max: 100,  unit: 'cm',    label: 'Water Level',          enabled: true },
}

// Load saved thresholds from localStorage
const loadSaved = () => {
  try {
    const raw = localStorage.getItem('nutriflow_thresholds')
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

  // Derive alert status for a given sensor key + value and fire browser notification if breached
  const getStatus = useCallback((key, value) => {
    const t = thresholds[key]
    if (!t || !t.enabled || value === undefined || value === null) return 'info'

    // Threshold breached
    if (value < t.min || value > t.max) {
      const now = Date.now()
      const lastSent = lastAlertTimes.current[key] || 0
      // 15 second throttle per sensor to avoid spamming notifications
      if (now - lastSent > 15000) {
        lastAlertTimes.current[key] = now
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`⚠️ NutriFlow Alert: ${t.label}`, {
              body: `${t.label} is currently ${typeof value === 'number' ? value.toFixed(1) : value} ${t.unit} (Safe range: ${t.min} - ${t.max} ${t.unit})`,
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

    // Warning zone: within 10% of limit
    const range  = t.max - t.min
    const buffer = range * 0.1
    if (value < t.min + buffer || value > t.max - buffer) return 'warning'
    return 'normal'
  }, [thresholds])

  // Update a single threshold field
  const updateThreshold = useCallback((key, field, value) => {
    setThresholds(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }, [])

  // Save to localStorage + backend (ESP32 polls from here)
  const saveThresholds = useCallback(async (customThresholds) => {
    const toSave = customThresholds || thresholds
    setSaving(true)
    setSaveStatus(null)

    localStorage.setItem('nutriflow_thresholds', JSON.stringify(toSave))
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

  // Reset to defaults
  const resetThresholds = useCallback(() => {
    setThresholds(DEFAULT_THRESHOLDS)
    localStorage.setItem('nutriflow_thresholds', JSON.stringify(DEFAULT_THRESHOLDS))
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
