// src/components/SensorGrid.jsx
import {
  Droplets, Gauge, Thermometer, Wind, CloudRain, Ruler,
} from 'lucide-react'
import SensorCard from './SensorCard'

const calcTrend = (current, prev) => {
  if (!prev || !current) return { trend: 'stable', trendValue: 0 }
  const diff = Math.round((current - prev) * 100) / 100
  if (Math.abs(diff) < 0.01) return { trend: 'stable', trendValue: diff }
  return { trend: diff > 0 ? 'up' : 'down', trendValue: diff }
}

const SensorGrid = ({ latest, previous, getStatus }) => {
  const phTrend  = calcTrend(latest?.ph,         previous?.ph)
  const tdsTrend = calcTrend(latest?.tds,         previous?.tds)
  const wtTrend  = calcTrend(latest?.waterTemp,   previous?.waterTemp)
  const atTrend  = calcTrend(latest?.airTemp,     previous?.airTemp)
  const humTrend = calcTrend(latest?.humidity,    previous?.humidity)
  const wlTrend  = calcTrend(latest?.waterLevel,  previous?.waterLevel)

  const cards = [
    {
      icon: Droplets,
      label: 'pH Level',
      value: latest?.ph?.toFixed(2),
      unit: 'pH',
      status: getStatus('ph', latest?.ph),
      subLabel: 'Water acidity / alkalinity',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      ...phTrend,
    },
    {
      icon: Gauge,
      label: 'TDS',
      value: latest?.tds,
      unit: 'PPM',
      status: getStatus('tds', latest?.tds),
      subLabel: 'Total Dissolved Solids — purity',
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/10 border-violet-500/20',
      ...tdsTrend,
    },
    {
      icon: Thermometer,
      label: 'Water Temp',
      value: latest?.waterTemp?.toFixed(1),
      unit: '°C',
      status: getStatus('waterTemp', latest?.waterTemp),
      subLabel: 'DS18B20 waterproof probe',
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/10 border-sky-500/20',
      ...wtTrend,
    },
    {
      icon: Wind,
      label: 'Air Temp',
      value: latest?.airTemp?.toFixed(1),
      unit: '°C',
      status: getStatus('airTemp', latest?.airTemp),
      subLabel: 'DHT11 ambient reading',
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/10 border-orange-500/20',
      ...atTrend,
    },
    {
      icon: CloudRain,
      label: 'Air Humidity',
      value: latest?.humidity,
      unit: '%',
      status: getStatus('humidity', latest?.humidity),
      subLabel: 'DHT11 relative humidity',
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20',
      ...humTrend,
    },
    {
      icon: Ruler,
      label: 'Water Level',
      value: latest?.waterLevel?.toFixed(1),
      unit: 'cm',
      status: getStatus('waterLevel', latest?.waterLevel),
      subLabel: 'HC-SR04 ultrasonic distance',
      iconColor: 'text-teal-400',
      iconBg: 'bg-teal-500/10 border-teal-500/20',
      ...wlTrend,
    },
  ]

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-400 tracking-widest uppercase">
          Live Sensor Readings
        </h2>
        <span className="text-xs text-zinc-600 tabular-nums">6 sensors active</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <SensorCard key={card.label} {...card} />
        ))}
      </div>
    </section>
  )
}

export default SensorGrid
