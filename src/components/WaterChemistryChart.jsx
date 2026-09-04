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
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/95 border border-zinc-700/60 rounded-xl px-4 py-3 shadow-2xl text-xs">
        <p className="text-zinc-400 mb-2 font-medium">{label}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-zinc-300">{entry.name}:</span>
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

const WaterChemistryChart = ({ history }) => {
  const [selectedHours, setSelectedHours] = useState(10)

  const data = useMemo(() => {
    const filtered = filterByHours(history, selectedHours)
    if (filtered.length > 300) {
      const step = Math.ceil(filtered.length / 300)
      return filtered.filter((_, i) => i % step === 0)
    }
    return filtered
  }, [history, selectedHours])

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Water Chemistry</h3>
            <p className="text-xs text-zinc-500">pH · TDS · EC over time ({data.length} pts)</p>
          </div>
        </div>

        {/* Legend + Time range selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-emerald-400 inline-block" />
              <span className="text-zinc-500">pH</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-violet-400 inline-block" />
              <span className="text-zinc-500">TDS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-yellow-400 inline-block" />
              <span className="text-zinc-500">EC</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-zinc-800/60 rounded-lg p-1 border border-zinc-700/50">
            {TIME_RANGES.map(r => (
              <button
                key={r.hours}
                onClick={() => setSelectedHours(r.hours)}
                className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all ${
                  selectedHours === r.hours
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dual axis chart — pH on left (0-14), TDS/EC on right */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.4)" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#52525b', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(63,63,70,0.4)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="ph"
            domain={[5.5, 8.5]}
            tick={{ fill: '#52525b', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <YAxis
            yAxisId="tds"
            orientation="right"
            domain={[0, 'auto']}
            tick={{ fill: '#52525b', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            yAxisId="ph"
            y={7.0}
            stroke="rgba(16,185,129,0.3)"
            strokeDasharray="4 4"
            label={{ value: 'pH 7.0', position: 'insideTopLeft', fill: 'rgba(16,185,129,0.5)', fontSize: 9 }}
          />
          <Line yAxisId="ph" type="monotone" dataKey="ph" name="pH" stroke="#34d399" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#34d399', strokeWidth: 0 }} />
          <Line yAxisId="tds" type="monotone" dataKey="tds" name="TDS" stroke="#a78bfa" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }} />
          <Line yAxisId="tds" type="monotone" dataKey="ec" name="EC" stroke="#facc15" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#facc15', strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WaterChemistryChart
