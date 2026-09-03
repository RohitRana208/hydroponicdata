// src/hooks/useThresholds.js
// ─────────────────────────────────────────────────────────────────────────────
// Manages sensor alert thresholds.
// Saved in localStorage so they persist across page reloads.
// Also syncs to backend so ESP32 can poll them.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : ''

export const DEFAULT_THRESHOLDS = {
  ph:         { min: 6.5,  max: 7.5,  unit: 'pH',  label: 'pH Level',         enabled: true },
  tds:        { min: 50,   max: 400,  unit: 'PPM', label: 'TDS',               enabled: true },
  waterTemp:  { min: 18.0, max: 28.0, unit: '°C',  label: 'Water Temperature', enabled: true },
  airTemp:    { min: 15.0, max: 40.0, unit: '°C',  label: 'Air Temperature',   enabled: false },
  humidity:   { min: 40,   max: 85,   unit: '%',   label: 'Air Humidity',      enabled: true },
  waterLevel: { min: 8.0,  max: 100,  unit: 'cm',  label: 'Water Level',       enabled: true },
}

// Load saved thresholds from localStorage
const loadSaved = () => {
  try {
    const raw = localStorage.getItem('nutriflow_thresholds')
    if (raw) {
      const parsed = JSON.parse(raw)
      // Merge with defaults to handle new keys
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
  const [saveStatus, setSaveStatus] = useState(null) // 'success' | 'error' | null

  // Derive alert status for a given sensor key + value
  const getStatus = useCallback((key, value) => {
    const t = thresholds[key]
    if (!t || !t.enabled || value === undefined || value === null) return 'info'
    if (value < t.min || value > t.max) return 'critical'
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

    // Save to localStorage (instant, works offline)
    localStorage.setItem('nutriflow_thresholds', JSON.stringify(toSave))
    setThresholds(toSave)

    // Try to sync to backend (ESP32 will poll this)
    try {
      await axios.post(`${BASE_URL}/api/sensors/thresholds`, { thresholds: toSave })
      setSaveStatus('success')
    } catch (_) {
      // Backend unavailable — localStorage still saved
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
