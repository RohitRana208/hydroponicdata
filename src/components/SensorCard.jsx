// src/components/SensorCard.jsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const statusConfig = {
  normal: {
    label: 'Normal',
    lightClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    darkClasses: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  },
  warning: {
    label: 'Warning',
    lightClasses: 'bg-amber-50 text-amber-700 border-amber-200',
    darkClasses: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  },
  critical: {
    label: 'Critical',
    lightClasses: 'bg-rose-50 text-rose-700 border-rose-200',
    darkClasses: 'bg-red-500/10 text-red-400 border-red-500/25',
  },
  info: {
    label: 'Measuring',
    lightClasses: 'bg-sky-50 text-sky-700 border-sky-200',
    darkClasses: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
  },
  offline: {
    label: 'Offline',
    lightClasses: 'bg-slate-100 text-slate-500 border-slate-200',
    darkClasses: 'bg-zinc-800 text-zinc-500 border-zinc-700/50',
  },
}

const SensorCard = ({
  icon: Icon,
  label,
  value,
  unit,
  status = 'normal',
  subLabel,
  iconColor = 'text-emerald-600 dark:text-emerald-400',
  iconBg = 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20',
  trend,
  trendValue,
  isConnected = false,
  selected = false,
  onClick,
}) => {
  const currentStatus = !isConnected ? 'offline' : (status || 'normal')
  const cfg = statusConfig[currentStatus] || statusConfig.normal

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up'   ? 'text-rose-500 dark:text-rose-400' :
    trend === 'down' ? 'text-sky-500 dark:text-sky-400'  :
    'text-slate-400 dark:text-zinc-500'

  return (
    <div
      onClick={onClick}
      className={`relative p-5 flex flex-col gap-3.5 cursor-pointer transition-all duration-200 rounded-2xl backdrop-blur-md hover:scale-[1.015] ${
        selected
          ? 'bg-blue-50/70 dark:bg-zinc-900/90 ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg shadow-blue-500/10'
          : isConnected
          ? 'bg-white/90 dark:bg-zinc-900/70 border border-emerald-300 dark:border-emerald-500/50 shadow-md shadow-emerald-500/5 hover:border-emerald-400'
          : 'bg-white/80 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-slate-300 dark:hover:border-zinc-700'
      }`}
    >
      {/* Green pulse dot ONLY when live connected */}
      {isConnected && (
        <span
          className="absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"
          style={{ boxShadow: '0 0 8px rgba(16,185,129,0.9)' }}
          title="Hardware Live Connected"
        />
      )}

      {/* Top row: icon + status */}
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${
          isConnected ? iconBg : 'bg-slate-100 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/40'
        }`}>
          <Icon className={`w-5 h-5 ${isConnected ? iconColor : 'text-slate-400 dark:text-zinc-500'}`} />
        </div>
        <span className={`status-badge border text-xs ${cfg.lightClasses} dark:${cfg.darkClasses}`}>
          {cfg.label}
        </span>
      </div>

      {/* Value */}
      <div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold tracking-wider uppercase mb-1">
          {label}
        </p>
        <div className="flex items-end gap-2">
          <span className={`text-3xl font-extrabold tabular-nums leading-none ${
            isConnected
              ? 'text-slate-900 dark:text-slate-100'
              : 'text-slate-400 dark:text-zinc-400'
          }`}>
            {value !== undefined && value !== null ? value : '—'}
          </span>
          <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400 mb-0.5">{unit}</span>
        </div>
        {subLabel && (
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{subLabel}</p>
        )}
      </div>

      {/* Trend row */}
      {trend && (
        <div className="flex items-center gap-1.5 text-xs mt-auto">
          <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
          <span className={`font-semibold ${trendColor}`}>
            {trendValue ? `${trendValue > 0 ? '+' : ''}${trendValue}` : trend}
          </span>
          <span className="text-slate-400 dark:text-zinc-500 ml-0.5">vs prev</span>
        </div>
      )}

      {/* Tap hint when selected */}
      {selected ? (
        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-auto flex items-center gap-1">
          📊 Graph Active Below ↓
        </p>
      ) : (
        <p className="text-[11px] text-slate-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors mt-auto">
          Tap card to view graph →
        </p>
      )}
    </div>
  )
}

export default SensorCard
