// src/components/DownloadButton.jsx
import { useState } from 'react'
import { Download } from 'lucide-react'

const DownloadButton = ({ history }) => {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    if (!history || history.length === 0) return
    setLoading(true)
    try {
      const XLSX = await import('xlsx')

      const rows = history.map(e => ({
        'Time':            e.time      || '',
        'Date':            e.dateStr   || '',
        'pH':              e.ph        ?? '',
        'TDS (PPM)':       e.tds       ?? '',
        'EC (mS/cm)':      e.ec        ?? '',
        'Water Temp (°C)': e.waterTemp ?? '',
        'Air Temp (°C)':   e.airTemp   ?? '',
        'Humidity (%)':    e.humidity  ?? '',
        'Water Level (cm)':e.waterLevel?? '',
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'NutriFlow Sensor Data')

      // Column widths
      ws['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 },
        { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
      ]

      const now = new Date()
      const filename = `nutriflow_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}.xlsx`

      XLSX.writeFile(wb, filename)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const count = history?.length ?? 0

  return (
    <button
      onClick={handleDownload}
      disabled={loading || count === 0}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 border shadow-sm ${
        loading || count === 0
          ? 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-600 cursor-not-allowed'
          : 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 hover:border-emerald-400 shadow-emerald-500/5 hover:shadow-emerald-500/15 active:scale-95'
      }`}
    >
      <Download className={`w-4 h-4 ${loading ? 'animate-bounce' : ''}`} />
      {loading ? 'Exporting...' : `Download Excel (${count} rows)`}
    </button>
  )
}

export default DownloadButton
