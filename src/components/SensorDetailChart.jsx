// src/components/SensorDetailChart.jsx
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
  { label: 'All',   hours: 48 },
]

const SENSOR_META = {
  ph:         { label: 'pH Level',                  unit: 'pH',    color: '#059669', darkColor: '#34d399', refLine: 7.0, refLabel: 'Target 7.0' },
  tds:        { label: 'Total Dissolved Solids',    unit: 'PPM',   color: '#7c3aed', darkColor: '#a78bfa', refLine: null },
  ec:         { label: 'Electrical Conductivity',   unit: 'mS/cm', color: '#d97706', darkColor: '#facc15', refLine: null },
  waterTemp:  { label: 'Water Temperature',         unit: '°C',    color: '#0284c7', darkColor: '#38bdf8', refLine: null },
  airTemp:    { label: 'Air Temperature',           unit: '°C',    color: '#ea580c', darkColor: '#fb923c', refLine: null },
  humidity:   { label: 'Relative Humidity',         unit: '%',     color: '#0891b2', darkColor: '#22d3ee', refLine: null },
  waterLevel: { label: 'Water Tank Level',          unit: 'cm',    color: '#0d9488', darkColor: '#2dd4bf', refLine: null },
}

const CustomTooltip = ({ active, payload, label, unit, color }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value
    return (
      <div className="bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-700/80 rounded-xl px-4 py-3 shadow-xl text-xs font-mono">
        <p className="text-slate-500 dark:text-zinc-400 mb-1.5 font-medium">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: color }} />
          <span className="font-bold text-sm text-slate-800 dark:text-slate-100 tabular-nums">
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
    color: '#059669',
    darkColor: '#34d399',
    refLine: null,
  }

  const filteredData = useMemo(() => {
    let data = filterByHours(history, selectedHours)
    data = data.filter(d => typeof d[sensorKey] === 'number' && !isNaN(d[sensorKey]))
    if (data.length > 250) {
      const step = Math.ceil(data.length / 250)
      return data.filter((_, i) => i % step === 0 || i === data.length - 1)
    }
    return data
  }, [history, selectedHours, sensorKey])

  const gradId = `grad-${sensorKey}`
  const timeLabel = selectedHours >= 48 ? 'All' : `${selectedHours} hr`

  // Stats
  const values = filteredData.map(d => d[sensorKey]).filter(v => typeof v === 'number')
  const minVal = values.length > 0 ? Math.min(...values).toFixed(1) : '—'
  const maxVal = values.length > 0 ? Math.max(...values).toFixed(1) : '—'
  const latestVal = values.length > 0 ? values[values.length - 1].toFixed(2) : '—'

  return (
    <div className="glass-card p-5 flex flex-col gap-4 border border-blue-200 dark:border-blue-500/30 shadow-lg shadow-blue-500/5 dark:shadow-[0_0_30px_rgba(59,130,246,0.15)] rounded-2xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm"
            style={{
              borderColor: `${meta.color}30`,
              background: `${meta.color}10`,
            }}
          >
            <Activity className="w-5 h-5" style={{ color: meta.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{meta.label}</h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold" style={{ background: `${meta.color}15`, color: meta.color }}>
                {meta.unit}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-500">
              {filteredData.length} data points ({timeLabel} view)
            </p>
          </div>
        </div>

        {/* Quick Stats & Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 text-xs font-mono bg-slate-50 dark:bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div><span className="text-slate-500 dark:text-zinc-500">Min:</span> <span className="text-sky-600 dark:text-sky-400 font-bold">{minVal}</span></div>
            <div><span className="text-slate-500 dark:text-zinc-500">Max:</span> <span className="text-rose-600 dark:text-rose-400 font-bold">{maxVal}</span></div>
            <div><span className="text-slate-500 dark:text-zinc-500">Live:</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">{latestVal}</span></div>
          </div>

          {/* Time-range selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900/90 rounded-xl p-1 border border-slate-200 dark:border-zinc-700/60 shadow-sm">
            {TIME_RANGES.map(r => (
              <button
                key={r.hours}
                onClick={() => setSelectedHours(r.hours)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedHours === r.hours
                    ? 'bg-white dark:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-blue-500/50 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-all shadow-sm"
            title="Close graph"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="w-full h-64 min-h-[256px]">
        {filteredData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-zinc-500 text-sm font-mono border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
            <Calendar className="w-6 h-6 text-slate-400 dark:text-zinc-600" />
            <span>No data available for {meta.label} in {timeLabel} window.</span>
            <span className="text-xs text-slate-400 dark:text-zinc-600">Hardware connect hone par data yahan stream hoga.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={240}>
            <AreaChart data={filteredData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={meta.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={meta.color} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip unit={meta.unit} color={meta.color} />} />
              {meta.refLine && (
                <ReferenceLine
                  y={meta.refLine}
                  stroke={`${meta.color}80`}
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
                activeDot={{ r: 5, fill: meta.color, stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default SensorDetailChart
