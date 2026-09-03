// src/components/SystemLogs.jsx
import { Terminal, AlertTriangle, Info, XCircle, Wifi } from 'lucide-react'

const levelConfig = {
  info: {
    icon: Info,
    color: 'text-sky-400',
    bg: 'bg-sky-500/5',
    prefix: 'INFO ',
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/5',
    prefix: 'WARN ',
  },
  error: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/5',
    prefix: 'CRIT ',
  },
  connect: {
    icon: Wifi,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/5',
    prefix: 'CONN ',
  },
}

const formatLogTime = (date) => {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

const SystemLogs = ({ logs }) => {
  return (
    <div className="glass-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-zinc-800/60 border border-zinc-700/40 rounded-lg flex items-center justify-center">
            <Terminal className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">System Logs</h3>
            <p className="text-xs text-zinc-500">Real-time alerts & events</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs text-zinc-600 font-mono">LIVE</span>
        </div>
      </div>

      {/* Scrollable log area */}
      <div className="flex-1 overflow-y-auto max-h-64 font-mono divide-y divide-zinc-800/40">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-zinc-600">
            No events logged yet.
          </div>
        ) : (
          logs.map((log) => {
            const cfg = levelConfig[log.level] || levelConfig.info
            const Icon = cfg.icon
            return (
              <div
                key={log.id}
                className={`terminal-line ${cfg.bg} hover:bg-zinc-800/30 transition-colors duration-100`}
              >
                {/* Timestamp */}
                <span className="text-zinc-600 shrink-0 tabular-nums">
                  {formatLogTime(log.time)}
                </span>
                {/* Level badge */}
                <span className={`shrink-0 font-bold tracking-wider ${cfg.color}`}>
                  [{cfg.prefix.trim()}]
                </span>
                {/* Icon */}
                <Icon className={`w-3 h-3 shrink-0 mt-0.5 ${cfg.color}`} />
                {/* Message */}
                <span className="text-zinc-300 leading-relaxed">{log.message}</span>
              </div>
            )
          })
        )}
      </div>

      {/* Footer: log count */}
      <div className="px-5 py-2.5 border-t border-zinc-800/60 flex items-center justify-between">
        <span className="text-xs font-mono text-zinc-600">
          {logs.length} event{logs.length !== 1 ? 's' : ''} logged
        </span>
        <span className="text-xs font-mono text-zinc-700">nutriflow/sys v1.0</span>
      </div>
    </div>
  )
}

export default SystemLogs
