// src/components/ControlPanel.jsx
import { useState } from 'react'
import { Target, CheckCircle2, AlertCircle, Loader2, Sliders } from 'lucide-react'

const ControlPanel = ({ addLog }) => {
  const [targetPh, setTargetPh] = useState('7.0')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)  // 'success' | 'error' | null

  const handleUpdate = async () => {
    const val = parseFloat(targetPh)
    if (isNaN(val) || val < 0 || val > 14) {
      setFeedback('error')
      setTimeout(() => setFeedback(null), 3000)
      return
    }

    setSaving(true)
    setFeedback(null)

    await new Promise(r => setTimeout(r, 600))
    addLog('info', `Target pH updated to ${val.toFixed(2)} via control panel.`)
    setFeedback('success')
    setSaving(false)
    setTimeout(() => setFeedback(null), 3000)
  }

  const quickTargets = ['6.5', '7.0', '7.2', '7.5']

  return (
    <div className="glass-card p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl flex items-center justify-center shadow-sm">
          <Sliders className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">Control Panel</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-500">Target pH Setpoint</p>
        </div>
      </div>

      {/* Target pH setter */}
      <div className="flex flex-col gap-3">
        <label className="text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest">
          pH Setpoint (0 – 14)
        </label>

        {/* Quick select buttons */}
        <div className="grid grid-cols-4 gap-2">
          {quickTargets.map((qt) => (
            <button
              key={qt}
              onClick={() => setTargetPh(qt)}
              className={`text-xs font-bold py-2 rounded-xl border transition-all duration-150 shadow-sm ${
                targetPh === qt
                  ? 'bg-emerald-500 text-white border-emerald-600 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-300'
                  : 'bg-white dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/40 text-slate-600 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-zinc-200'
              }`}
            >
              {qt}
            </button>
          ))}
        </div>

        {/* Manual input + submit */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Target className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="number"
              value={targetPh}
              onChange={(e) => setTargetPh(e.target.value)}
              min={0}
              max={14}
              step={0.1}
              placeholder="7.0"
              className="input-dark w-full pl-8 pr-3 font-mono font-bold"
            />
          </div>
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="btn-primary flex items-center gap-2 min-w-[120px] justify-center text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : null}
            {saving ? 'Updating…' : 'Update Target'}
          </button>
        </div>

        {/* Feedback */}
        {feedback === 'success' && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 rounded-xl px-3.5 py-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Target pH updated successfully.
          </div>
        )}
        {feedback === 'error' && (
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-red-400 bg-rose-50 dark:bg-red-500/10 border border-rose-200 dark:border-red-500/25 rounded-xl px-3.5 py-2 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Invalid pH value. Enter a number between 0 and 14.
          </div>
        )}
      </div>

      {/* System info */}
      <div className="border-t border-slate-100 dark:border-zinc-800/60 pt-4 grid grid-cols-2 gap-3">
        {[
          { label: 'Poll Interval', value: '2s' },
          { label: 'History Memory', value: '48 hrs' },
          { label: 'Protocol', value: 'HTTP/REST' },
          { label: 'Database', value: 'MongoDB Atlas' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-50 dark:bg-zinc-800/30 rounded-xl px-3 py-2 border border-slate-100 dark:border-zinc-800/40">
            <p className="text-xs text-slate-400 dark:text-zinc-500 mb-0.5">{label}</p>
            <p className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-300">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ControlPanel
