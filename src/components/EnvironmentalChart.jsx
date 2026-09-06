// src/components/EnvironmentalChart.jsx
import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Thermometer } from 'lucide-react'
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
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
              {entry.dataKey.includes('Temp') ? '°C' : entry.dataKey === 'humidity' ? '%' : ' cm'}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const EnvironmentalChart = ({ history = [] }) => {
  const [selectedHours, setSelectedHours] = useState(10)

  const data = useMemo(() => {
    return filterByHours(history, selectedHours)
  }, [history, selectedHours])

  const timeLabel = selectedHours >= 48 ? 'All' : `${selectedHours} hr`

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl flex items-center justify-center shadow-sm">
            <Thermometer className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">Environmental Trends</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-500">
              Temp · Humidity · Water Level ({data.length} pts · {timeLabel} view)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-sky-500 inline-block" />
              <span className="text-slate-500 dark:text-zinc-400">Water</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-orange-500 inline-block" />
              <span className="text-slate-500 dark:text-zinc-400">Air</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-cyan-500 inline-block" />
              <span className="text-slate-500 dark:text-zinc-400">Humidity</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 rounded-xl p-1 border border-slate-200 dark:border-zinc-700/50 shadow-sm">
            {TIME_RANGES.map(r => (
              <button
                key={r.hours}
                onClick={() => setSelectedHours(r.hours)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedHours === r.hours
                    ? 'bg-white dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-slate-200 dark:border-orange-500/40 shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full h-56 min-h-[220px]">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 dark:text-zinc-600 font-mono">
            No readings found for {timeLabel} window
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="waterTempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0284c7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="airTempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ea580c" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="humidityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0891b2" stopOpacity={0.2}  />
                  <stop offset="95%" stopColor="#0891b2" stopOpacity={0}    />
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
                width={28}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="waterTemp" name="Water Temp" stroke="#0284c7" strokeWidth={2} fill="url(#waterTempGrad)" dot={data.length <= 20 ? { r: 3, fill: '#0284c7' } : false} activeDot={{ r: 4, fill: '#0284c7', strokeWidth: 0 }} />
              <Area type="monotone" dataKey="airTemp"   name="Air Temp"   stroke="#ea580c" strokeWidth={2} fill="url(#airTempGrad)"   dot={data.length <= 20 ? { r: 3, fill: '#ea580c' } : false} activeDot={{ r: 4, fill: '#ea580c', strokeWidth: 0 }} />
              <Area type="monotone" dataKey="humidity"  name="Humidity"   stroke="#0891b2" strokeWidth={2} fill="url(#humidityGrad)"  dot={data.length <= 20 ? { r: 3, fill: '#0891b2' } : false} activeDot={{ r: 4, fill: '#0891b2', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default EnvironmentalChart
