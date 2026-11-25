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

  // 2. For datasets with smaller time spans, slice proportionally:
  const ratios = { 1: 0.2, 2: 0.4, 5: 0.6, 10: 0.8, 20: 1.0, 48: 1.0 }
  const ratio = ratios[h] || Math.min(1, h / 20)
  const count = Math.max(2, Math.ceil(history.length * ratio))
  return history.slice(-count)
}

// ── Generate realistic time-series data for fully grown healthy lettuce ──
export const generateIdealLettuceHistory = () => {
  const points = []
  const now = Date.now()
  const totalPoints = 48 // 48 hours time series

  for (let i = totalPoints; i >= 0; i--) {
    const t = new Date(now - i * 3600000)
    const hour = t.getHours()
    const isDay = hour >= 6 && hour <= 21

    const ph = 5.95 + Math.sin(i * 0.4) * 0.18 + (Math.random() - 0.5) * 0.06
    const ec = 1.32 + Math.cos(i * 0.35) * 0.08 + (Math.random() - 0.5) * 0.04
    const tds = Math.round(ec * 500 + (Math.random() - 0.5) * 15)
    const waterTemp = 20.2 + (isDay ? 0.7 : -0.6) + (Math.random() - 0.5) * 0.3
    const airTemp = isDay 
      ? 23.4 + Math.sin(i * 0.5) * 1.1 + (Math.random() - 0.5) * 0.4
      : 18.8 + Math.cos(i * 0.5) * 0.8 + (Math.random() - 0.5) * 0.4
    const humidity = Math.round(63 + (isDay ? -4 : 5) + Math.sin(i * 0.3) * 3 + (Math.random() - 0.5) * 2)
    const waterLevel = parseFloat((18.8 - (totalPoints - i) * 0.02 + (Math.random() - 0.5) * 0.1).toFixed(1))

    points.push({
      time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateStr: t.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      rawTime: t.getTime(),
      ph: parseFloat(ph.toFixed(2)),
      tds: tds,
      ec: parseFloat(ec.toFixed(2)),
      waterTemp: parseFloat(waterTemp.toFixed(1)),
      airTemp: parseFloat(airTemp.toFixed(1)),
      humidity: humidity,
      waterLevel: waterLevel,
    })
  }

  return points
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

// ─────────────────────────────────────────────────────────────────────────────
export const useSensorData = () => {
  // Mode selection: 'simulation' (realistic lettuce telemetry) vs 'hardware' (live ESP32 / DB only)
  const [dataSourceMode, setDataSourceMode] = useState(() => {
    return localStorage.getItem('nutriflow_data_mode') || 'simulation'
  })

  const [realHistory, setRealHistory] = useState([])
  const [realLatest, setRealLatest]   = useState(null)
  const [realConnected, setRealConnected] = useState(false)

  const [simHistory, setSimHistory]   = useState(generateIdealLettuceHistory)

  const [lastReadingTime, setLastReadingTime] = useState(new Date())
  const [lastUpdated, setLastUpdated]         = useState(new Date())
  const [isLoading, setIsLoading]             = useState(false)
  const [logs, setLogs]                       = useState([
    { id: 1, time: new Date(), level: 'info', message: 'NutriFlow Core initialized.' },
  ])
  const logIdRef  = useRef(2)
  const prevIdRef = useRef(null)

  const addLog = useCallback((level, message) => {
    setLogs(prev => [
      { id: logIdRef.current++, time: new Date(), level, message },
      ...prev.slice(0, 49),
    ])
  }, [])

  // Toggle function saved to localStorage
  const toggleDataMode = (mode) => {
    const targetMode = mode || (dataSourceMode === 'simulation' ? 'hardware' : 'simulation')
    setDataSourceMode(targetMode)
    localStorage.setItem('nutriflow_data_mode', targetMode)
    if (targetMode === 'hardware') {
      addLog('info', 'Switched to [Real Hardware Live Mode]. Listening directly to ESP32 / MongoDB.')
    } else {
      addLog('info', 'Switched to [Ideal Simulation Mode]. Calibrated realistic lettuce telemetry active.')
    }
  }

  // 1. Fetch Real History from MongoDB on mount
  useEffect(() => {
    let cancelled = false
    axios.get(`${BASE}/api/sensors/history?limit=50000`, { timeout: 8000 })
      .then(res => {
        if (cancelled) return
        const docs = Array.isArray(res.data) ? res.data : []
        if (docs.length > 0) {
          const entries = docs.map(toChartEntry)
          setRealHistory(entries)
          const lastDoc = docs[docs.length - 1]
          prevIdRef.current = String(lastDoc._id || '')
          setRealLatest(toChartEntry(lastDoc))

          const docTime = new Date(lastDoc.createdAt || lastDoc.timestamp || Date.now()).getTime()
          setLastReadingTime(new Date(docTime))
          const isLive = Date.now() - docTime < 30000
          setRealConnected(isLive)
        } else {
          setRealConnected(false)
        }
      })
      .catch(() => {
        if (cancelled) return
        setRealConnected(false)
      })
    return () => { cancelled = true }
  }, [])

  // 2. Poll Real ESP32 / Server data
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${BASE}/api/sensors/latest`, { timeout: 3500 })
        const data = res.data
        if (data && typeof data === 'object' && Object.keys(data).length > 2) {
          const docTime = new Date(data.createdAt || data.timestamp || Date.now()).getTime()
          const isLive = Date.now() - docTime < 30000
          setRealConnected(isLive)
          setLastReadingTime(new Date(docTime))

          const entry = toChartEntry(data)
          setRealLatest(entry)

          const id = String(data._id || '')
          if (id && id !== prevIdRef.current) {
            prevIdRef.current = id
            setRealHistory(prev => [...prev.slice(-150), entry])
          }
        } else {
          setRealConnected(false)
        }
      } catch {
        setRealConnected(false)
      }

      setLastUpdated(new Date())

      // 3. Continuous realistic drift if in simulation mode
      setSimHistory(prev => {
        const last = prev[prev.length - 1]
        if (!last) return prev

        const now = Date.now()
        const dPh = (Math.random() - 0.5) * 0.03
        const dEc = (Math.random() - 0.5) * 0.02
        const dWaterTemp = (Math.random() - 0.5) * 0.05
        const dAirTemp = (Math.random() - 0.5) * 0.08
        const dHum = (Math.random() - 0.5) * 0.4
        const dWater = (Math.random() - 0.5) * 0.02

        const newPh = Math.max(5.75, Math.min(6.25, last.ph + dPh))
        const newEc = Math.max(1.15, Math.min(1.48, last.ec + dEc))
        const newTds = Math.round(newEc * 500)
        const newWaterTemp = Math.max(19.2, Math.min(21.8, last.waterTemp + dWaterTemp))
        const newAirTemp = Math.max(21.0, Math.min(25.0, last.airTemp + dAirTemp))
        const newHum = Math.round(Math.max(55, Math.min(72, last.humidity + dHum)))
        const newWaterLevel = parseFloat(Math.max(15.0, Math.min(22.0, last.waterLevel + dWater)).toFixed(1))

        const newPoint = {
          time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          dateStr: new Date(now).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          rawTime: now,
          ph: parseFloat(newPh.toFixed(2)),
          tds: newTds,
          ec: parseFloat(newEc.toFixed(2)),
          waterTemp: parseFloat(newWaterTemp.toFixed(1)),
          airTemp: parseFloat(newAirTemp.toFixed(1)),
          humidity: newHum,
          waterLevel: newWaterLevel,
        }

        return [...prev.slice(-150), newPoint]
      })
    }, POLL_MS)

    return () => clearInterval(interval)
  }, [])

  // Output depends on active Mode
  const isSimulation = dataSourceMode === 'simulation'
  const history = isSimulation ? simHistory : realHistory
  const latest  = isSimulation 
    ? (simHistory.length > 0 ? simHistory[simHistory.length - 1] : null)
    : (realLatest || (realHistory.length > 0 ? realHistory[realHistory.length - 1] : null))
  const previous = history.length > 1 ? history[history.length - 2] : null
  const isConnected = isSimulation ? true : realConnected

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
    dataSourceMode,
    toggleDataMode,
  }
}
