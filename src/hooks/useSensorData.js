// src/hooks/useSensorData.js
import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

const POLL_MS = 2000
const BASE    = ''

// ── Smart time filter: handles multi-day data as well as short test datasets ──
export const filterByHours = (history, hours) => {
  if (!history || history.length === 0) return []
  if (hours === 'all' || hours >= 48) return history

  const h = typeof hours === 'number' ? hours : parseFloat(hours) || 10
  const maxTime = history[history.length - 1]?.rawTime || Date.now()
  const minTime = history[0]?.rawTime || maxTime
  const totalSpanHours = (maxTime - minTime) / 3600000

  // 1. If data spans at least 1 hour, use exact timestamp window
  if (totalSpanHours >= 1) {
    const cutoff = maxTime - h * 3600000
    const filtered = history.filter(e => (e.rawTime || 0) >= cutoff)
    if (filtered.length >= 2) return filtered
  }

  // 2. For datasets with smaller time spans, slice proportionally so every button updates the graph:
  // 1hr -> 20%, 2hr -> 40%, 5hr -> 60%, 10hr -> 80%, 20hr+ -> 100%
  const ratios = { 1: 0.2, 2: 0.4, 5: 0.6, 10: 0.8, 20: 1.0, 48: 1.0 }
  const ratio = ratios[h] || Math.min(1, h / 20)
  const count = Math.max(2, Math.ceil(history.length * ratio))
  return history.slice(-count)
}

// ── Convert a DB doc to a chart-friendly object ───────────────────────────────
export const toChartEntry = (doc) => {
  const t = new Date(doc.createdAt || doc.timestamp || Date.now())
  const tdsVal = typeof doc.tds === 'number' ? doc.tds : null
  const ecVal = typeof doc.ec === 'number' && doc.ec > 0
    ? doc.ec
    : (tdsVal !== null ? parseFloat((tdsVal / 500).toFixed(2)) : null)

  return {
    time:       t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    dateStr:    t.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    rawTime:    t.getTime(),
    ph:         typeof doc.ph         === 'number' ? doc.ph         : null,
    tds:        tdsVal,
    ec:         ecVal,
    waterTemp:  typeof doc.waterTemp  === 'number' ? doc.waterTemp  : null,
    airTemp:    typeof doc.airTemp    === 'number' ? doc.airTemp    : null,
    humidity:   typeof doc.humidity   === 'number' ? doc.humidity   : null,
    waterLevel: typeof doc.waterLevel === 'number' ? doc.waterLevel : null,
  }
}

// ── Threshold alerts ──────────────────────────────────────────────────────────
const checkThresholds = (data, addLog) => {
  if (data.ph != null && (data.ph < 6.5 || data.ph > 7.5))
    addLog('warn', `pH out of range: ${data.ph.toFixed(2)} (Target 7.0 ± 0.5)`)
  if (data.tds != null && data.tds > 400)
    addLog('warn', `TDS elevated: ${data.tds} PPM — check nutrients`)
  if (data.waterLevel != null && data.waterLevel < 10)
    addLog('error', `Low water level: ${data.waterLevel.toFixed(1)} cm — refill tank`)
  if (data.waterTemp != null && data.waterTemp > 30)
    addLog('warn', `Water temp high: ${data.waterTemp.toFixed(1)}°C`)
}

// ─────────────────────────────────────────────────────────────────────────────
export const useSensorData = () => {
  const [history,          setHistory]          = useState([])
  const [isConnected,      setIsConnected]      = useState(false)
  const [lastReadingTime,  setLastReadingTime]  = useState(null)
  const [lastUpdated,      setLastUpdated]      = useState(new Date())
  const [isLoading,        setIsLoading]        = useState(true)
  const [logs,             setLogs]             = useState([
    { id: 1, time: new Date(), level: 'info', message: 'NutriFlow Dashboard initialized.' },
  ])
  const logIdRef  = useRef(2)
  const prevIdRef = useRef(null)

  const addLog = useCallback((level, message) => {
    setLogs(prev => [
      { id: logIdRef.current++, time: new Date(), level, message },
      ...prev.slice(0, 49),
    ])
  }, [])

  // ── Load history on mount ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    axios.get(`${BASE}/api/sensors/history?limit=50000`, { timeout: 12000 })
      .then(res => {
        if (cancelled) return
        const docs = Array.isArray(res.data) ? res.data : []
        if (docs.length > 0) {
          const entries = docs.map(toChartEntry)
          setHistory(entries)
          const lastDoc = docs[docs.length - 1]
          prevIdRef.current = String(lastDoc._id || '')

          const docTime = new Date(lastDoc.createdAt || lastDoc.timestamp || Date.now()).getTime()
          setLastReadingTime(new Date(docTime))
          const isLive = Date.now() - docTime < 25000
          setIsConnected(isLive)

          addLog('info', `✅ Loaded ${docs.length} readings into memory. Hardware ${isLive ? 'Online' : 'Offline'}.`)
        } else {
          setIsConnected(false)
          addLog('info', 'Server connected — waiting for ESP32 data…')
        }
        setIsLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setIsConnected(false)
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

        const docTime = new Date(data.createdAt || data.timestamp || Date.now()).getTime()
        const isLive = Date.now() - docTime < 25000

        setIsConnected(isLive)
        setLastReadingTime(new Date(docTime))
        setLastUpdated(new Date())

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

        setIsLoading(false)
      } catch {
        setIsConnected(false)
      }
    }, POLL_MS)
    return () => clearInterval(interval)
  }, [addLog])

  const latest   = history.length > 0 ? history[history.length - 1] : null
  const previous = history.length > 1 ? history[history.length - 2] : null

  return {
    latest,
    previous,
    history,
    logs,
    isConnected,
    lastReadingTime,
    isLoading,
    lastUpdated,
    addLog,
  }
}
