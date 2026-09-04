// src/hooks/useSensorData.js
// ─────────────────────────────────────────────────────────────────────────────
// Custom hook — Real MongoDB Atlas backend se live data fetch karta hai
// ESP32 → Vercel Serverless → MongoDB Atlas → Dashboard
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

const POLL_INTERVAL_MS = 2000
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

// ─── Threshold alert rules ────────────────────────────────────────────────────
const checkThresholds = (data, addLog) => {
  if (data.ph < 6.5 || data.ph > 7.5)
    addLog('warn', `pH out of range: ${data.ph.toFixed(2)} (target 7.0 ± 0.5)`)
  if (data.tds > 400)
    addLog('warn', `TDS elevated: ${data.tds} PPM — check mineral filter.`)
  if (data.waterLevel < 10)
    addLog('error', `Low water level: ${data.waterLevel.toFixed(1)} cm — refill required!`)
  if (data.waterTemp > 30)
    addLog('warn', `Water temp high: ${data.waterTemp.toFixed(1)}°C`)
  if (data.humidity > 85)
    addLog('warn', `Humidity very high: ${data.humidity}%`)
}

// ─── Convert DB document → chart-friendly entry ───────────────────────────────
export const toChartEntry = (doc) => ({
  time:       new Date(doc.createdAt || doc.timestamp || Date.now())
                .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  rawTime:    new Date(doc.createdAt || doc.timestamp || Date.now()).getTime(),
  ph:         doc.ph         ?? null,
  tds:        doc.tds        ?? null,
  ec:         doc.ec         ?? null,
  waterTemp:  doc.waterTemp  ?? null,
  airTemp:    doc.airTemp    ?? null,
  humidity:   doc.humidity   ?? null,
  waterLevel: doc.waterLevel ?? null,
})

// ─── Filter history to N hours ────────────────────────────────────────────────
export const filterByHours = (history, hours) => {
  const cutoff = Date.now() - hours * 60 * 60 * 1000
  return history.filter(e => e.rawTime >= cutoff)
}

// ─────────────────────────────────────────────────────────────────────────────
export const useSensorData = () => {
  const [history,     setHistory]     = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isLoading,   setIsLoading]   = useState(true)
  const [logs, setLogs] = useState([
    { id: 1, time: new Date(), level: 'info', message: 'System booting... connecting to NutriFlow server.' },
  ])
  const logIdRef  = useRef(2)
  const prevIdRef = useRef(null)

  const addLog = useCallback((level, message) => {
    setLogs(prev => [
      { id: logIdRef.current++, time: new Date(), level, message },
      ...prev.slice(0, 49),
    ])
  }, [])

  // ── Main polling tick ──────────────────────────────────────────────────────
  const tick = useCallback(async () => {
    try {
      const res  = await axios.get(`${API_BASE}/api/sensors/latest`, { timeout: 8000 })
      const data = res.data

      const isNew = data._id !== prevIdRef.current
      prevIdRef.current = data._id

      if (isNew) {
        const entry = toChartEntry(data)
        setHistory(prev => {
          // Keep at most 48h of data (prevent unbounded growth)
          const cutoff = Date.now() - 48 * 60 * 60 * 1000
          const trimmed = prev.filter(e => e.rawTime >= cutoff)
          return [...trimmed, entry]
        })
        checkThresholds(data, addLog)
      }

      setIsConnected(true)
      setIsLoading(false)
      setLastUpdated(new Date())
    } catch (err) {
      setIsConnected(false)
      addLog('error', `Server se connection fail: ${err.message}`)
    }
  }, [addLog])

  // ── On mount: load last 48 hours from DB ───────────────────────────────────
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res  = await axios.get(`${API_BASE}/api/sensors/history?hours=48&limit=50000`, { timeout: 15000 })
        const docs = res.data

        if (docs && docs.length > 0) {
          setHistory(docs.map(toChartEntry))
          prevIdRef.current = docs[docs.length - 1]._id
          setIsConnected(true)
          setIsLoading(false)
          addLog('info', `✅ MongoDB Atlas connected. ${docs.length} readings loaded (last 48h).`)
        } else {
          addLog('info', 'Server connected — ESP32 ka data wait kar raha hun...')
          setIsConnected(true)
          setIsLoading(false)
        }
      } catch (err) {
        addLog('error', `Server nahi mila: ${err.message} — Polling se data aayega.`)
        setIsLoading(false)
      }
    }
    loadHistory()
  }, [addLog])

  // ── Poll every 2 seconds ───────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(tick, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [tick])

  const latest = history.length > 0 ? history[history.length - 1] : null
  const previous = history.length >= 2 ? history[history.length - 2] : null

  return {
    latest,
    previous,
    history,
    logs,
    isConnected,
    isLoading,
    lastUpdated,
    addLog,
  }
}
