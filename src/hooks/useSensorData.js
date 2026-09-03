// src/hooks/useSensorData.js
// ─────────────────────────────────────────────────────────────────────────────
// Custom hook — Real MongoDB Atlas backend se live data fetch karta hai
// ESP32 → Express Server (port 5001) → MongoDB Atlas → Dashboard
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchLatestSensorData } from '../api/sensorApi'

const POLL_INTERVAL_MS = 2000
const HISTORY_LENGTH   = 30

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
const toChartEntry = (doc) => ({
  time:       new Date(doc.createdAt || doc.timestamp || Date.now())
                .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  ph:         doc.ph,
  tds:        doc.tds,
  waterTemp:  doc.waterTemp,
  airTemp:    doc.airTemp,
  humidity:   doc.humidity,
  waterLevel: doc.waterLevel,
})

// ─── Placeholder history while first fetch loads ──────────────────────────────
const createLoadingHistory = () => {
  const now = Date.now()
  return Array.from({ length: HISTORY_LENGTH }, (_, i) => ({
    time:       new Date(now - (HISTORY_LENGTH - i) * POLL_INTERVAL_MS)
                  .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    ph:         7.0,
    tds:        350,
    waterTemp:  24.0,
    airTemp:    28.0,
    humidity:   65,
    waterLevel: 13.0,
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
export const useSensorData = () => {
  const [history,     setHistory]     = useState(createLoadingHistory)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isLoading,   setIsLoading]   = useState(true)
  const [logs, setLogs] = useState([
    { id: 1, time: new Date(), level: 'info', message: 'System booting... connecting to NutriFlow server.' },
  ])
  const logIdRef  = useRef(2)
  const prevIdRef = useRef(null)   // track last doc _id to detect new readings

  const addLog = useCallback((level, message) => {
    setLogs(prev => [
      { id: logIdRef.current++, time: new Date(), level, message },
      ...prev.slice(0, 49),
    ])
  }, [])

  // ── Main polling tick ──────────────────────────────────────────────────────
  const tick = useCallback(async () => {
    try {
      const data = await fetchLatestSensorData()   // GET /api/sensors/latest

      // Sirf naya data aaya ho to history update karo
      const isNew = data._id !== prevIdRef.current
      prevIdRef.current = data._id

      const entry = toChartEntry(data)

      setHistory(prev => {
        const last = prev[prev.length - 1]
        // Naya _id ho ya latest values alag ho to update karo
        if (!isNew && last && last.tds === entry.tds && last.ph === entry.ph) return prev
        return [...prev.slice(1 - HISTORY_LENGTH), entry]
      })

      // Threshold check sirf naya data aane pe
      if (isNew) checkThresholds(data, addLog)

      setIsConnected(true)
      setIsLoading(false)
      setLastUpdated(new Date())

    } catch (err) {
      setIsConnected(false)
      addLog('error', `Server se connection fail: ${err.message}`)
    }
  }, [addLog])

  // ── On mount: try to load history from API ─────────────────────────────────
  useEffect(() => {
    const loadHistory = async () => {
      try {
        // /api/sensors/history se last 30 readings fetch karo
        const { default: axios } = await import('axios')
        const base = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : ''
        const res  = await axios.get(`${base}/api/sensors/history?limit=${HISTORY_LENGTH}`)
        const docs = res.data

        if (docs && docs.length > 0) {
          setHistory(docs.map(toChartEntry))
          prevIdRef.current = docs[docs.length - 1]._id
          setIsConnected(true)
          setIsLoading(false)
          addLog('info', `✅ MongoDB Atlas connected. ${docs.length} readings loaded.`)
        } else {
          addLog('info', 'Server connected — ESP32 ka data wait kar raha hun...')
          setIsConnected(true)
          setIsLoading(false)
        }
      } catch (err) {
        addLog('error', `Server nahi mila: ${err.message} — Mock data dikh raha hai.`)
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

  const latest = history[history.length - 1]

  return {
    latest,
    history,
    logs,
    isConnected,
    isLoading,
    lastUpdated,
    addLog,
  }
}
