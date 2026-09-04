// src/components/SensorDetailChart.jsx
// Shown when user taps a sensor card — displays that sensor's data with time-range selector
import { useState, useMemo } from 'react'
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { X } from 'lucide-react'
import { filterByHours } from '../hooks/useSensorData'

const TIME_RANGES = [
  { label: '1 hr',  hours: 1  },
  { label: '2 hr',  hours: 2  },
  { label: '5 hr',  hours: 5  },
  { label: '10 hr', hours: 10 },
  { label: '20 hr', hours: 20 },
]

const SENSOR_META = {
  ph:         { label: 'pH Level',          unit: 'pH',    color: '#34d399', refLine: 7.0, refLabel: 'Target 7.0' },
  tds:        { label: 'TDS',               unit: 'PPM',   color: '#a78bfa', refLine: null },
  ec:         { label: 'EC',                unit: 'mS/cm', color: '#facc15', refLine: null },
  waterTemp:  { label: 'Water Temperature', unit: '°C',    color: '#38bdf8', refLine: null },
  airTemp:    { label: 'Air Temperature',   unit: '°C',    color: '#fb923c', refLine: null },
  humidity:   { label: 'Air Humidity',      unit: '%',     color: '#22d3ee', refLine: null },
  waterLevel: { label: 'Water Level',       unit: 'cm',    color: '#2dd4bf', refLine: null },
}

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/95 border border-zinc-700/60 rounded-xl px-4 py-3 shadow-2xl text-xs">
        <p className="text-zinc-400 mb-2 font-medium">{label}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="font-bold tabular-nums" style={{ color: entry.color }}>
              {typeof entry.value === 'number' ? entry.value.toFixed(2) : '—'} {unit}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const SensorDetailChart = ({ sensorKey, history, onClose }) => {
  const [selectedHours, setSelectedHours] = useState(10)

  const meta = SENSOR_META[sensorKey]
  if (!meta) return null

  const filteredData = useMemo(() => {
    const filtered = filterByHours(history, selectedHours)
    // Thin down to max 300 points to keep chart fast
    if (filtered.length > 300) {
      const step = Math.ceil(filtered.length / 300)
      return filtered.filter((_, i) => i % step === 0)
    }
    return filtered
  }, [history, selectedHours])

  const gradId = `grad-${sensorKey}`

  return (
    <div className="glass-card p-5 flex flex-col gap-4 border border-blue-500/30 shadow-[0_0_24px_rgba(96,165,250,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full" style={{ background: meta.color }} />
          <div>
            <h3 className="text-sm font-semibold text-slate-200">{meta.label}</h3>
            <p className="text-xs text-zinc-500">
              {filteredData.length} readings in last {selectedHours}h
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Time-range dropdown */}
          <div className="flex items-center gap-1 bg-zinc-800/60 rounded-lg p-1 border border-zinc-700/50">
            {TIME_RANGES.map(r => (
              <button
                key={r.hours}
                onClick={() => setSelectedHours(r.hours)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedHours === r.hours
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {/* Close button */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chart */}
      {filteredData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">
          No data in the selected time range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={filteredData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={meta.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={meta.color} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.4)" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#52525b', fontSize: 9 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(63,63,70,0.4)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: '#52525b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip content={<CustomTooltip unit={meta.unit} />} />
            {meta.refLine && (
              <ReferenceLine
                y={meta.refLine}
                stroke={`${meta.color}55`}
                strokeDasharray="4 4"
                label={{ value: meta.refLabel, position: 'insideTopLeft', fill: `${meta.color}99`, fontSize: 9 }}
              />
            )}
            <Area
              type="monotone"
              dataKey={sensorKey}
              stroke={meta.color}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 4, fill: meta.color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default SensorDetailChart
