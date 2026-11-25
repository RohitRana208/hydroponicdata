// src/components/Header.jsx
import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Activity, RefreshCw, Sun, Moon, Bell } from 'lucide-react'

const Header = ({ isConnected, lastUpdated, theme, toggleTheme }) => {
  const [permStatus, setPermStatus] = useState('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermStatus(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.')
      return
    }
    try {
      const perm = await Notification.requestPermission()
      setPermStatus(perm)
      if (perm === 'granted') {
        new Notification('🌱 NutriFlow Notifications Enabled!', {
          body: 'You will receive instant alerts whenever parameters fluctuate outside limits.',
          icon: '/favicon.svg'
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const formatTime = (date) => {
    try {
      const d = date instanceof Date ? date : new Date(date || Date.now())
      return isNaN(d.getTime()) ? '--:--:--' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch (_) {
      return '--:--:--'
    }
  }

  const isDark = theme === 'dark'

  return (
    <header className="glass-card px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-200/60 dark:border-zinc-800/80">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-sm">
            {/* Water drop SVG logo */}
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
              <path
                d="M12 2C12 2 5 9.5 5 14.5C5 18.09 8.13 21 12 21C15.87 21 19 18.09 19 14.5C19 9.5 12 2 12 2Z"
                className="fill-emerald-500/20 dark:fill-emerald-400/30"
                stroke="#059669"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="M9 15C9 15 9.5 17.5 12 17.5"
                stroke="#059669"
                strokeWidth="1.75"
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
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 font-semibold tracking-widest uppercase">
            Smart Sensor Dashboard
          </p>
        </div>
      </div>

      {/* Status indicators, Notification Permission & Theme Switcher */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* System active */}
        <div className="status-badge bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-400 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          System Active
        </div>

        {/* Connection badge */}
        <div className={`status-badge border shadow-sm ${
          isConnected
            ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/25 text-sky-700 dark:text-sky-400'
            : 'bg-rose-50 dark:bg-red-500/10 border-rose-200 dark:border-red-500/25 text-rose-700 dark:text-red-400'
        }`}>
          {isConnected
            ? <Wifi className="w-3.5 h-3.5" />
            : <WifiOff className="w-3.5 h-3.5" />
          }
          {isConnected ? 'Connected' : 'Offline'}
        </div>

        {/* Browser Alert Permission Button */}
        <button
          onClick={requestPermission}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-sm ${
            permStatus === 'granted'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
              : 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
          }`}
          title="Enable Browser Alerts for Sensor Fluctuations"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{permStatus === 'granted' ? 'Alerts On' : 'Enable Alerts'}</span>
        </button>

        {/* Last updated */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 bg-slate-100/90 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/40 rounded-full px-3 py-1 shadow-sm font-medium">
          <RefreshCw className="w-3 h-3 text-emerald-600 dark:text-zinc-500" />
          <span>Updated:</span>
          <span className="text-slate-900 dark:text-zinc-200 font-semibold tabular-nums">
            {formatTime(lastUpdated)}
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 shadow-sm bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-zinc-700 hover:border-emerald-300 active:scale-95"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </button>

        {/* Documentation Link */}
        <a
          href="/NutriFlow_Technical_Documentation.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 shadow-sm bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 active:scale-95"
          title="View Technical Documentation"
        >
          <span>📄 Docs</span>
        </a>
      </div>
    </header>
  )
}

export default Header
