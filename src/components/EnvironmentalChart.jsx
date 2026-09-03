// src/components/EnvironmentalChart.jsx
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Thermometer } from 'lucide-react'

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
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}°C
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const EnvironmentalChart = ({ history }) => {
  const data = history.slice(-20)

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center">
            <Thermometer className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Environmental Trends</h3>
            <p className="text-xs text-zinc-500">Water Temp vs Air Temp (°C)</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded bg-sky-400 inline-block" />
            <span className="text-zinc-500">Water</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded bg-orange-400 inline-block" />
            <span className="text-zinc-500">Air</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="waterTempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="airTempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fb923c" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.4)" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#52525b', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(63,63,70,0.4)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#52525b', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="waterTemp"
            name="Water Temp"
            stroke="#38bdf8"
            strokeWidth={2}
            fill="url(#waterTempGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="airTemp"
            name="Air Temp"
            stroke="#fb923c"
            strokeWidth={2}
            fill="url(#airTempGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#fb923c', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default EnvironmentalChart
