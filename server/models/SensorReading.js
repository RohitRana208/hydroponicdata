const mongoose = require('mongoose')

// ── Schema Definition ────────────────────────────────────────────────────────
// Yeh MongoDB mein ek "table" (collection) define karta hai
// Har ek sensor reading ek document hogi

const sensorReadingSchema = new mongoose.Schema(
  {
    // pH Level — 0 to 14
    ph: {
      type: Number,
      required: [true, 'pH value required hai'],
      min: 0,
      max: 14,
    },

    // TDS (Total Dissolved Solids) — PPM mein
    tds: {
      type: Number,
      required: [true, 'TDS value required hai'],
      min: 0,
    },

    // DS18B20 — Pani ka temperature
    waterTemp: {
      type: Number,
      required: [true, 'Water temperature required hai'],
    },

    // DHT11 — Hawa ka temperature
    airTemp: {
      type: Number,
      required: [true, 'Air temperature required hai'],
    },

    // DHT11 — Hawa ki nami (%)
    humidity: {
      type: Number,
      required: [true, 'Humidity required hai'],
      min: 0,
      max: 100,
    },

    // HC-SR04 — Pani ki door (cm)
    waterLevel: {
      type: Number,
      required: [true, 'Water level required hai'],
      min: 0,
    },
  },
  {
    // Automatically createdAt aur updatedAt fields add karta hai
    timestamps: true,
  }
)

// ── Index for Time-series Queries ────────────────────────────────────────────
// Latest data jaldi fetch hoga is index ki wajah se
sensorReadingSchema.index({ createdAt: -1 })

// ── TTL Index ─────────────────────────────────────────────────────────────────
// 7 din (604800 sec) ke baad purana data automatically delete ho jayega
// Isse database full nahi hoga
sensorReadingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 })

module.exports = mongoose.model('SensorReading', sensorReadingSchema)
