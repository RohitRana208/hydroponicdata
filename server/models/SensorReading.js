import mongoose from 'mongoose'

const sensorReadingSchema = new mongoose.Schema(
  {
    ph: {
      type: Number,
      required: [true, 'pH value required hai'],
      min: 0,
      max: 14,
    },
    tds: {
      type: Number,
      required: [true, 'TDS value required hai'],
      min: 0,
    },
    waterTemp: {
      type: Number,
      required: [true, 'Water temperature required hai'],
    },
    airTemp: {
      type: Number,
      required: [true, 'Air temperature required hai'],
    },
    humidity: {
      type: Number,
      required: [true, 'Humidity required hai'],
      min: 0,
      max: 100,
    },
    waterLevel: {
      type: Number,
      required: [true, 'Water level required hai'],
      min: 0,
    },
  },
  { timestamps: true }
)

sensorReadingSchema.index({ createdAt: -1 })
sensorReadingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 })

export default mongoose.models.SensorReading || mongoose.model('SensorReading', sensorReadingSchema)
