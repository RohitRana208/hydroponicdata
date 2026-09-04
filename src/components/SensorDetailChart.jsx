// src/components/SensorDetailChart.jsx
// Shown when user taps a sensor card — displays that sensor's data with time-range selector
import { useState, useMemo } from 'react'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { X, Calendar, Activity } from 'lucide-react'
import { filterByHours } from '../hooks/useSensorData'

const TIME_RANGES = [
  { label: '1 hr',  hours: 1  },
  { label: '2 hr',  hours: 2  },
  { label: '5 hr',  hours: 5  },
  { label: '10 hr', hours: 10 },
  { label: '20 hr', hours: 20 },
  { label: '48 hr', hours: 48 },
]

const SENSOR_META = {
  ph:         { label: 'pH Level',                  unit: 'pH',    color: '#34d399', refLine: 7.0, refLabel: 'Target 7.0' },
  tds:        { label: 'Total Dissolved Solids',    unit: 'PPM',   color: '#a78bfa', refLine: null },
  ec:         { label: 'Electrical Conductivity',   unit: 'mS/cm', color: '#facc15', refLine: null },
  waterTemp:  { label: 'Water Temperature',         unit: '°C',    color: '#38bdf8', refLine: null },
  airTemp:    { label: 'Air Temperature',           unit: '°C',    color: '#fb923c', refLine: null },
  humidity:   { label: 'Relative Humidity',         unit: '%',     color: '#22d3ee', refLine: null },
  waterLevel: { label: 'Water Tank Level',          unit: 'cm',    color: '#2dd4bf', refLine: null },
}

const CustomTooltip = ({ active, payload, label, unit, color }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value
    return (
      <div className="bg-zinc-900/95 border border-zinc-700/80 rounded-xl px-4 py-3 shadow-2xl text-xs font-mono">
        <p className="text-zinc-400 mb-1.5">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <span className="font-bold text-sm text-slate-100 tabular-nums">
            {typeof val === 'number' ? val.toFixed(2) : (val ?? '—')} {unit}
          </span>
        </div>
      </div>
    )
  }
  return null
}

const SensorDetailChart = ({ sensorKey, history = [], onClose }) => {
  const [selectedHours, setSelectedHours] = useState(10)

  const meta = SENSOR_META[sensorKey] || {
    label: sensorKey?.toUpperCase() || 'Sensor',
    unit: '',
    color: '#34d399',
    refLine: null,
  }

  const filteredData = useMemo(() => {
    let data = filterByHours(history, selectedHours)
    if (!data || data.length === 0) {
      data = history.slice(-50)
    }
    // Filter out null/undefined values for this sensorKey
    data = data.filter(d => typeof d[sensorKey] === 'number' && !isNaN(d[sensorKey]))

    // Downsample if more than 250 points for smooth performance
    if (data.length > 250) {
      const step = Math.ceil(data.length / 250)
      return data.filter((_, i) => i % step === 0 || i === data.length - 1)
    }
    return data
  }, [history, selectedHours, sensorKey])

  const gradId = `grad-${sensorKey}`

  // Stats
  const values = filteredData.map(d => d[sensorKey]).filter(v => typeof v === 'number')
  const minVal = values.length > 0 ? Math.min(...values).toFixed(1) : '—'
  const maxVal = values.length > 0 ? Math.max(...values).toFixed(1) : '—'
  const latestVal = values.length > 0 ? values[values.length - 1].toFixed(2) : '—'

  return (
    <div className="glass-card p-5 flex flex-col gap-4 border border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.15)] rounded-2xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
            style={{
              borderColor: `${meta.color}40`,
              background: `${meta.color}15`,
            }}
          >
            <Activity className="w-5 h-5" style={{ color: meta.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">{meta.label}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold" style={{ background: `${meta.color}20`, color: meta.color }}>
                {meta.unit}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              {filteredData.length} data points in time window
            </p>
          </div>
        </div>

        {/* Quick Stats & Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 text-xs font-mono bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
            <div><span className="text-zinc-500">Min:</span> <span className="text-sky-400 font-bold">{minVal}</span></div>
            <div><span className="text-zinc-500">Max:</span> <span className="text-rose-400 font-bold">{maxVal}</span></div>
            <div><span className="text-zinc-500">Live:</span> <span className="text-emerald-400 font-bold">{latestVal}</span></div>
          </div>

          {/* Time-range selector */}
          <div className="flex items-center gap-1 bg-zinc-900/90 rounded-lg p-1 border border-zinc-700/60">
            {TIME_RANGES.map(r => (
              <button
                key={r.hours}
                onClick={() => setSelectedHours(r.hours)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedHours === r.hours
                    ? 'bg-blue-500/25 text-blue-300 border border-blue-500/50 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-all"
            title="Close graph"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart container with guaranteed dimensions */}
      <div className="w-full h-64 min-h-[256px]">
        {filteredData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-500 text-sm font-mono border border-dashed border-zinc-800 rounded-xl">
            <Calendar className="w-6 h-6 text-zinc-600" />
            <span>No data available for {meta.label} in selected range.</span>
            <span className="text-xs text-zinc-600">Hardware connect hone par data yahan stream hoga.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={240}>
            <AreaChart data={filteredData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={meta.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={meta.color} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.35)" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#71717a', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(63,63,70,0.5)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#71717a', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip unit={meta.unit} color={meta.color} />} />
              {meta.refLine && (
                <ReferenceLine
                  y={meta.refLine}
                  stroke={`${meta.color}70`}
                  strokeDasharray="4 4"
                  label={{ value: meta.refLabel, position: 'insideTopLeft', fill: meta.color, fontSize: 10 }}
                />
              )}
              <Area
                type="monotone"
                dataKey={sensorKey}
                name={meta.label}
                stroke={meta.color}
                strokeWidth={2.5}
                fill={`url(#${gradId})`}
                dot={filteredData.length <= 25 ? { r: 3, fill: meta.color, strokeWidth: 0 } : false}
                activeDot={{ r: 5, fill: meta.color, stroke: '#18181b', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default SensorDetailChart
