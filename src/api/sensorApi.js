// src/api/sensorApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Axios API layer — swap baseURL and hook fetchLatestSensorData() into your
// real Express backend when ready.  The dashboard polls this every 3 seconds.
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Fetch the latest sensor readings from the backend.
 * GET /api/sensors/latest
 *
 * Expected response shape:
 * {
 *   ph: 7.2,
 *   tds: 342,
 *   waterTemp: 24.5,
 *   airTemp: 28.1,
 *   humidity: 65,
 *   waterLevel: 12.4,
 *   timestamp: "2026-09-03T04:08:11Z"
 * }
 */
export const fetchLatestSensorData = async () => {
  const response = await apiClient.get('/api/sensors/latest')
  return response.data
}

/**
 * Update the target pH setpoint on the backend.
 * POST /api/sensors/target-ph
 */
export const updateTargetPh = async (targetPh) => {
  const response = await apiClient.post('/api/sensors/target-ph', { targetPh })
  return response.data
}

export default apiClient
