# UrbanLock HydroCore Intelligence 🌊

A real-time IoT sensor dashboard built with **React + Vite + Tailwind CSS + Recharts**.

## Tech Stack

| Layer | Library |
|-------|---------|
| Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 2 |
| Icons | Lucide React |
| HTTP | Axios |

## Getting Started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle → dist/
```

## Project Structure

```
src/
├── api/
│   └── sensorApi.js          # Axios client + API helpers
├── components/
│   ├── Header.jsx             # Nav bar with status badges
│   ├── SensorCard.jsx         # Reusable glassmorphism sensor card
│   ├── SensorGrid.jsx         # 6-card responsive grid
│   ├── WaterChemistryChart.jsx  # pH + TDS multi-line chart
│   ├── EnvironmentalChart.jsx   # Water/Air temp area chart
│   ├── ControlPanel.jsx       # Target pH setter widget
│   └── SystemLogs.jsx         # Terminal-style event log
├── hooks/
│   └── useSensorData.js       # Data hook (mock + API placeholder)
├── App.jsx
├── main.jsx
└── index.css
```

## Connecting to Your Express Backend

1. Set `VITE_API_BASE_URL` in `.env` to your server URL:
   ```
   VITE_API_BASE_URL=http://192.168.1.100:5000
   ```

2. In `src/hooks/useSensorData.js`, uncomment the axios block inside `tick()` and remove the mock block.

3. In `src/components/ControlPanel.jsx`, uncomment the `updateTargetPh` call.

**Expected GET `/api/sensors/latest` response:**
```json
{
  "ph": 7.2,
  "tds": 342,
  "waterTemp": 24.5,
  "airTemp": 28.1,
  "humidity": 65,
  "waterLevel": 12.4,
  "timestamp": "2026-09-03T04:08:11Z"
}
```

## Sensors Monitored

| Sensor | Hardware | Unit |
|--------|----------|------|
| pH Level | Analog pH probe | pH |
| TDS | TDS-3 digital probe | PPM |
| Water Temperature | DS18B20 | °C |
| Air Temperature | DHT11 | °C |
| Air Humidity | DHT11 | % |
| Water Level Distance | HC-SR04 ultrasonic | cm |
