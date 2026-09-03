# NutriFlow — Smart IoT Sensor Dashboard 🌊

A real-time IoT water monitoring dashboard & backend built with **React + Vite + Tailwind CSS + Recharts + Express + MongoDB Atlas**.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Backend | Express.js |
| Database | MongoDB Atlas (Cloud) |

## Getting Started

### 1. Dashboard (Frontend)
```bash
npm install
npm run dev        # http://localhost:5173
```

### 2. Express Server (Backend)
```bash
cd server
npm install
node server.js     # http://localhost:5001
```

## Features

- **Live Real-time Dashboard:** Auto-updates every 3 seconds
- **6 Hardware Parameters:** pH Level, TDS (PPM), Water Temp, Air Temp, Air Humidity, Water Level Distance
- **Interactive Threshold Settings:** Set Min/Max alerts for all sensors, saved locally & synced to backend for hardware
- **Time-Series Charts:** Dual Y-axis water chemistry line chart & environmental gradient area chart
- **MongoDB Atlas Integration:** Continuous cloud logging with automatic 7-day TTL cleanup
