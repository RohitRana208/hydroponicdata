// src/components/WaterChemistryChart.jsx
import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { FlaskConical } from 'lucide-react'
import { filterByHours } from '../hooks/useSensorData'

const TIME_RANGES = [
  { label: '1 hr',  hours: 1  },
  { label: '2 hr',  hours: 2  },
  { label: '5 hr',  hours: 5  },
  { label: '10 hr', hours: 10 },
  { label: '20 hr', hours: 20 },
  { label: 'All',   hours: 48 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-700/80 rounded-xl px-4 py-3 shadow-xl text-xs font-mono">
        <p className="text-slate-500 dark:text-zinc-400 mb-1.5 font-medium">{label}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: entry.color }} />
            <span className="text-slate-600 dark:text-zinc-300 font-medium">{entry.name}:</span>
            <span className="font-bold tabular-nums" style={{ color: entry.color }}>
              {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
              {entry.dataKey === 'ph' ? ' pH' : entry.dataKey === 'ec' ? ' mS/cm' : ' PPM'}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const WaterChemistryChart = ({ history = [] }) => {
  const [selectedHours, setSelectedHours] = useState(10)

  const data = useMemo(() => {
    return filterByHours(history, selectedHours)
  }, [history, selectedHours])

  const timeLabel = selectedHours >= 48 ? 'All' : `${selectedHours} hr`

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-center justify-center shadow-sm">
            <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">Water Chemistry</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-500">
              pH · TDS · EC ({data.length} pts · {timeLabel} view)
            </p>
          </div>
        </div>

        {/* Legend + Time range selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-emerald-500 inline-block" />
              <span className="text-slate-500 dark:text-zinc-400">pH</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-violet-500 inline-block" />
              <span className="text-slate-500 dark:text-zinc-400">TDS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-amber-500 inline-block" />
              <span className="text-slate-500 dark:text-zinc-400">EC</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 rounded-xl p-1 border border-slate-200 dark:border-zinc-700/50 shadow-sm">
            {TIME_RANGES.map(r => (
              <button
                key={r.hours}
                onClick={() => setSelectedHours(r.hours)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedHours === r.hours
                    ? 'bg-white dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-emerald-500/40 shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dual axis chart */}
      <div className="w-full h-56 min-h-[220px]">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 dark:text-zinc-600 font-mono">
            No readings found for {timeLabel} window
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
            <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="ph"
                domain={[5.5, 8.5]}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <YAxis
                yAxisId="tds"
                orientation="right"
                domain={[0, 'auto']}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                yAxisId="ph"
                y={7.0}
                stroke="rgba(16,185,129,0.4)"
                strokeDasharray="4 4"
                label={{ value: 'pH 7.0', position: 'insideTopLeft', fill: '#059669', fontSize: 9 }}
              />
              <Line yAxisId="ph" type="monotone" dataKey="ph" name="pH" stroke="#059669" strokeWidth={2} dot={data.length <= 20 ? { r: 3, fill: '#059669' } : false} activeDot={{ r: 4, fill: '#059669', strokeWidth: 0 }} />
              <Line yAxisId="tds" type="monotone" dataKey="tds" name="TDS" stroke="#7c3aed" strokeWidth={2} dot={data.length <= 20 ? { r: 3, fill: '#7c3aed' } : false} activeDot={{ r: 4, fill: '#7c3aed', strokeWidth: 0 }} />
              <Line yAxisId="tds" type="monotone" dataKey="ec" name="EC" stroke="#d97706" strokeWidth={2} dot={data.length <= 20 ? { r: 3, fill: '#d97706' } : false} activeDot={{ r: 4, fill: '#d97706', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default WaterChemistryChart
