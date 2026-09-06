// src/components/SensorGrid.jsx
import {
  Droplets, Gauge, Thermometer, Wind, CloudRain, Ruler, Zap,
} from 'lucide-react'
import SensorCard from './SensorCard'

const calcTrend = (current, prev) => {
  if (!prev || !current) return { trend: 'stable', trendValue: 0 }
  const diff = Math.round((current - prev) * 100) / 100
  if (Math.abs(diff) < 0.01) return { trend: 'stable', trendValue: diff }
  return { trend: diff > 0 ? 'up' : 'down', trendValue: diff }
}

const SensorGrid = ({ latest, previous, getStatus, isConnected, selectedSensor, onSensorSelect }) => {
  const phTrend  = calcTrend(latest?.ph,         previous?.ph)
  const tdsTrend = calcTrend(latest?.tds,         previous?.tds)
  const ecTrend  = calcTrend(latest?.ec,          previous?.ec)
  const wtTrend  = calcTrend(latest?.waterTemp,   previous?.waterTemp)
  const atTrend  = calcTrend(latest?.airTemp,     previous?.airTemp)
  const humTrend = calcTrend(latest?.humidity,    previous?.humidity)
  const wlTrend  = calcTrend(latest?.waterLevel,  previous?.waterLevel)

  const cards = [
    {
      key: 'ph',
      icon: Droplets,
      label: 'pH Level',
      value: latest?.ph != null ? latest.ph.toFixed(2) : null,
      unit: 'pH',
      status: getStatus('ph', latest?.ph),
      subLabel: 'Water acidity / alkalinity',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20',
      ...phTrend,
    },
    {
      key: 'tds',
      icon: Gauge,
      label: 'TDS',
      value: latest?.tds != null ? latest.tds : null,
      unit: 'PPM',
      status: getStatus('tds', latest?.tds),
      subLabel: 'Total Dissolved Solids',
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-50 border-violet-200 dark:bg-violet-500/10 dark:border-violet-500/20',
      ...tdsTrend,
    },
    {
      key: 'ec',
      icon: Zap,
      label: 'EC',
      value: latest?.ec != null ? latest.ec.toFixed(2) : null,
      unit: 'mS/cm',
      status: getStatus('ec', latest?.ec),
      subLabel: 'Electrical Conductivity',
      iconColor: 'text-amber-600 dark:text-yellow-400',
      iconBg: 'bg-amber-50 border-amber-200 dark:bg-yellow-500/10 dark:border-yellow-500/20',
      ...ecTrend,
    },
    {
      key: 'waterTemp',
      icon: Thermometer,
      label: 'Water Temp',
      value: latest?.waterTemp != null ? latest.waterTemp.toFixed(1) : null,
      unit: '°C',
      status: getStatus('waterTemp', latest?.waterTemp),
      subLabel: 'DS18B20 waterproof probe',
      iconColor: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/20',
      ...wtTrend,
    },
    {
      key: 'airTemp',
      icon: Wind,
      label: 'Air Temp',
      value: latest?.airTemp != null ? latest.airTemp.toFixed(1) : null,
      unit: '°C',
      status: getStatus('airTemp', latest?.airTemp),
      subLabel: 'DHT11 ambient reading',
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20',
      ...atTrend,
    },
    {
      key: 'humidity',
      icon: CloudRain,
      label: 'Air Humidity',
      value: latest?.humidity != null ? latest.humidity : null,
      unit: '%',
      status: getStatus('humidity', latest?.humidity),
      subLabel: 'DHT11 relative humidity',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-500/10 dark:border-cyan-500/20',
      ...humTrend,
    },
    {
      key: 'waterLevel',
      icon: Ruler,
      label: 'Water Level',
      value: latest?.waterLevel != null ? latest.waterLevel.toFixed(1) : null,
      unit: 'cm',
      status: getStatus('waterLevel', latest?.waterLevel),
      subLabel: 'HC-SR04 ultrasonic sensor',
      iconColor: 'text-teal-600 dark:text-teal-400',
      iconBg: 'bg-teal-50 border-teal-200 dark:bg-teal-500/10 dark:border-teal-500/20',
      ...wlTrend,
    },
  ]

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xs font-bold text-slate-500 dark:text-zinc-400 tracking-widest uppercase">
          Live Sensor Readings
        </h2>
        <div className="flex items-center gap-2.5">
          {isConnected ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 px-3 py-1 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ESP32 Live Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 font-medium bg-slate-100 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/40 px-3 py-1 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-zinc-600" />
              Hardware Offline (Last Reading)
            </span>
          )}
          <span className="text-xs text-slate-400 dark:text-zinc-500 tabular-nums font-mono">7 sensors</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <SensorCard
            key={card.key}
            {...card}
            isConnected={isConnected}
            selected={selectedSensor === card.key}
            onClick={() => onSensorSelect?.(selectedSensor === card.key ? null : card.key)}
          />
        ))}
      </div>
    </section>
  )
}

export default SensorGrid
