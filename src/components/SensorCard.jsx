// src/components/SensorCard.jsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const statusConfig = {
  normal: {
    label: 'Normal',
    classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    glow: 'rgba(16,185,129,0.08)',
  },
  warning: {
    label: 'Warning',
    classes: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    glow: 'rgba(245,158,11,0.08)',
  },
  critical: {
    label: 'Critical',
    classes: 'bg-red-500/10 text-red-400 border-red-500/25',
    glow: 'rgba(239,68,68,0.08)',
  },
  info: {
    label: 'Measuring',
    classes: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
    glow: 'rgba(14,165,233,0.08)',
  },
}

const SensorCard = ({
  icon: Icon,
  label,
  value,
  unit,
  status = 'normal',
  subLabel,
  iconColor = 'text-emerald-400',
  iconBg = 'bg-emerald-500/10 border-emerald-500/20',
  trend,       // 'up' | 'down' | 'stable'
  trendValue,
}) => {
  const cfg = statusConfig[status] || statusConfig.normal

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up' ? 'text-rose-400' :
    trend === 'down' ? 'text-sky-400' :
    'text-zinc-500'

  return (
    <div
      className="glass-card-hover p-5 flex flex-col gap-4 cursor-default"
      style={{ background: `linear-gradient(135deg, rgba(24,24,27,0.7) 0%, ${cfg.glow} 100%)` }}
    >
      {/* Top row: icon + status */}
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className={`status-badge border text-xs ${cfg.classes}`}>
          {cfg.label}
        </span>
      </div>

      {/* Value */}
      <div>
        <p className="text-xs text-zinc-500 font-medium tracking-widest uppercase mb-1">
          {label}
        </p>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-slate-100 tabular-nums leading-none">
            {value !== undefined && value !== null ? value : '—'}
          </span>
          <span className="text-sm text-zinc-400 mb-0.5 font-medium">{unit}</span>
        </div>
        {subLabel && (
          <p className="text-xs text-zinc-600 mt-1.5">{subLabel}</p>
        )}
      </div>

      {/* Trend row */}
      {trend && (
        <div className="flex items-center gap-1.5 text-xs mt-auto">
          <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
          <span className={trendColor}>
            {trendValue ? `${trendValue > 0 ? '+' : ''}${trendValue}` : trend}
          </span>
          <span className="text-zinc-600 ml-0.5">vs prev</span>
        </div>
      )}
    </div>
  )
}

export default SensorCard
