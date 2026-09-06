// src/components/Header.jsx
import { Wifi, WifiOff, Activity, RefreshCw, Sun, Moon } from 'lucide-react'

const Header = ({ isConnected, lastUpdated, theme, toggleTheme }) => {
  const formatTime = (date) => {
    try {
      const d = date instanceof Date ? date : new Date(date || Date.now())
      return isNaN(d.getTime()) ? '--:--:--' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch (_) {
      return '--:--:--'
    }
  }

  return (
    <header className="glass-card px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200/80 dark:border-zinc-800">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 rounded-xl flex items-center justify-center">
            {/* Water drop SVG logo */}
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
              <path
                d="M12 2C12 2 5 9.5 5 14.5C5 18.09 8.13 21 12 21C15.87 21 19 18.09 19 14.5C19 9.5 12 2 12 2Z"
                fill="rgba(16,185,129,0.25)"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M9 15C9 15 9.5 17.5 12 17.5"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full pulse-dot" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
            Nutri<span className="text-emerald-600 dark:text-emerald-400 neon-text">Flow</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5 font-medium tracking-widest uppercase">
            Smart Hydroponics Dashboard
          </p>
        </div>
      </div>

      {/* Status indicators & Theme Switcher */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* System active */}
        <div className="status-badge bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          System Active
        </div>

        {/* Connection badge */}
        <div className={`status-badge border ${
          isConnected
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
            : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400'
        }`}>
          {isConnected
            ? <Wifi className="w-3 h-3" />
            : <WifiOff className="w-3 h-3" />
          }
          {isConnected ? 'ESP32 Online' : 'ESP32 Offline'}
        </div>

        {/* Live Feed */}
        <div className="status-badge bg-slate-100 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/40 text-slate-600 dark:text-zinc-400">
          <Activity className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Live Feed
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700/30 rounded-full px-3 py-1">
          <RefreshCw className="w-3 h-3 text-slate-400 dark:text-zinc-600" />
          <span>Sync:</span>
          <span className="text-slate-700 dark:text-zinc-300 font-medium tabular-nums">
            {formatTime(lastUpdated)}
          </span>
        </div>

        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-sm transition-all text-xs font-medium"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  )
}

export default Header
