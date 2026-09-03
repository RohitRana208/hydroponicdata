// src/components/Header.jsx
import { Wifi, WifiOff, Activity, Droplets, RefreshCw } from 'lucide-react'

const Header = ({ isConnected, lastUpdated }) => {
  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <header className="glass-card px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
            {/* Water drop SVG logo */}
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
              <path
                d="M12 2C12 2 5 9.5 5 14.5C5 18.09 8.13 21 12 21C15.87 21 19 18.09 19 14.5C19 9.5 12 2 12 2Z"
                fill="rgba(16,185,129,0.3)"
                stroke="#34d399"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M9 15C9 15 9.5 17.5 12 17.5"
                stroke="#34d399"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full pulse-dot" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-100 leading-none">
            Hydro<span className="text-emerald-400 neon-text">Data</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5 font-medium tracking-widest uppercase">
            Smart Sensor Dashboard
          </p>
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex flex-wrap items-center gap-3">
        {/* System active */}
        <div className="status-badge bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          System Active
        </div>

        {/* Connection badge */}
        <div className={`status-badge border ${
          isConnected
            ? 'bg-sky-500/10 border-sky-500/25 text-sky-400'
            : 'bg-red-500/10 border-red-500/25 text-red-400'
        }`}>
          {isConnected
            ? <Wifi className="w-3 h-3" />
            : <WifiOff className="w-3 h-3" />
          }
          {isConnected ? 'Connected' : 'Offline'}
        </div>

        {/* Activity indicator */}
        <div className="status-badge bg-zinc-800/60 border border-zinc-700/40 text-zinc-400">
          <Activity className="w-3 h-3 text-emerald-500" />
          Live Feed
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-800/40 border border-zinc-700/30 rounded-full px-3 py-1">
          <RefreshCw className="w-3 h-3 text-zinc-600" />
          <span>Updated:</span>
          <span className="text-zinc-300 font-medium tabular-nums">
            {formatTime(lastUpdated)}
          </span>
        </div>
      </div>
    </header>
  )
}

export default Header
