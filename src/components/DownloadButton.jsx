// src/components/DownloadButton.jsx
// Downloads all stored history as Excel (.xlsx) using SheetJS
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
        'Time':         e.time      || '',
        'pH':           e.ph        ?? '',
        'TDS (PPM)':    e.tds       ?? '',
        'EC (mS/cm)':   e.ec        ?? '',
        'Water Temp (°C)': e.waterTemp ?? '',
        'Air Temp (°C)':   e.airTemp   ?? '',
        'Humidity (%)': e.humidity  ?? '',
        'Water Level (cm)': e.waterLevel ?? '',
      }))

      const ws   = XLSX.utils.json_to_sheet(rows)
      const wb   = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sensor Data')

      // Column widths
      ws['!cols'] = [
        { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 12 },
        { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
      ]

      const now      = new Date()
      const filename = `nutriflow_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}.xlsx`

      XLSX.writeFile(wb, filename)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading || !history || history.length === 0}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
        loading
          ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_16px_rgba(16,185,129,0.2)]'
      }`}
    >
      <Download className={`w-4 h-4 ${loading ? 'animate-bounce' : ''}`} />
      {loading ? 'Exporting...' : `Download Excel (${history?.length ?? 0} rows)`}
    </button>
  )
}

export default DownloadButton
