// src/hooks/useSensorData.js
import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

const POLL_MS = 2000
const BASE    = ''   // same-origin on Vercel; override with VITE_API_BASE_URL if needed

// ── Util: filter history to last N hours ─────────────────────────────────────
export const filterByHours = (history, hours) => {
  const cutoff = Date.now() - hours * 3600000
  return history.filter(e => (e.rawTime || 0) >= cutoff)
}

// ── Convert a DB doc to a chart-friendly object ───────────────────────────────
export const toChartEntry = (doc) => {
  const t = new Date(doc.createdAt || Date.now())
  return {
    time:       t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    rawTime:    t.getTime(),
    ph:         typeof doc.ph         === 'number' ? doc.ph         : null,
    tds:        typeof doc.tds        === 'number' ? doc.tds        : null,
    ec:         typeof doc.ec         === 'number' ? doc.ec         : null,
    waterTemp:  typeof doc.waterTemp  === 'number' ? doc.waterTemp  : null,
    airTemp:    typeof doc.airTemp    === 'number' ? doc.airTemp    : null,
    humidity:   typeof doc.humidity   === 'number' ? doc.humidity   : null,
    waterLevel: typeof doc.waterLevel === 'number' ? doc.waterLevel : null,
  }
}

// ── Threshold alerts ──────────────────────────────────────────────────────────
const checkThresholds = (data, addLog) => {
  if (data.ph != null && (data.ph < 6.5 || data.ph > 7.5))
    addLog('warn', `pH out of range: ${data.ph.toFixed(2)}`)
  if (data.tds != null && data.tds > 400)
    addLog('warn', `TDS elevated: ${data.tds} PPM`)
  if (data.waterLevel != null && data.waterLevel < 10)
    addLog('error', `Low water level: ${data.waterLevel.toFixed(1)} cm`)
  if (data.waterTemp != null && data.waterTemp > 30)
    addLog('warn', `Water temp high: ${data.waterTemp.toFixed(1)}°C`)
}

// ─────────────────────────────────────────────────────────────────────────────
export const useSensorData = () => {
  const [history,     setHistory]     = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isLoading,   setIsLoading]   = useState(true)
  const [logs,        setLogs]        = useState([
    { id: 1, time: new Date(), level: 'info', message: 'Connecting to NutriFlow server…' },
  ])
  const logIdRef  = useRef(2)
  const prevIdRef = useRef(null)

  const addLog = useCallback((level, message) => {
    setLogs(prev => [
      { id: logIdRef.current++, time: new Date(), level, message },
      ...prev.slice(0, 49),
    ])
  }, [])

  // ── Load 48h history on mount ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    axios.get(`${BASE}/api/sensors/history?hours=48&limit=50000`, { timeout: 12000 })
      .then(res => {
        if (cancelled) return
        const docs = Array.isArray(res.data) ? res.data : []
        if (docs.length > 0) {
          setHistory(docs.map(toChartEntry))
          prevIdRef.current = String(docs[docs.length - 1]._id)
          setIsConnected(true)
          addLog('info', `✅ Connected · ${docs.length} readings loaded (last 48h)`)
        } else {
          setIsConnected(true)
          addLog('info', 'Server connected · waiting for ESP32 data…')
        }
        setIsLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        addLog('error', `Could not load history: ${err.message}`)
        setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [addLog])

  // ── Poll latest every 2s ──────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res  = await axios.get(`${BASE}/api/sensors/latest`, { timeout: 5000 })
        const data = res.data
        if (!data || typeof data !== 'object') return

        const id = String(data._id || '')
        if (id && id !== prevIdRef.current) {
          prevIdRef.current = id
          const entry = toChartEntry(data)
          setHistory(prev => {
            const cutoff  = Date.now() - 48 * 3600000
            const trimmed = prev.filter(e => (e.rawTime || 0) >= cutoff)
            return [...trimmed, entry]
          })
          checkThresholds(data, addLog)
        }

        setIsConnected(true)
        setIsLoading(false)
        setLastUpdated(new Date())
      } catch {
        setIsConnected(false)
      }
    }, POLL_MS)
    return () => clearInterval(interval)
  }, [addLog])

  const latest   = history.length > 0 ? history[history.length - 1] : null
  const previous = history.length > 1 ? history[history.length - 2] : null

  return { latest, previous, history, logs, isConnected, isLoading, lastUpdated, addLog }
}
