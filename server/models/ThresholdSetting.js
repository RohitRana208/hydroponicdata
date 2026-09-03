import mongoose from 'mongoose'

const thresholdSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'global' },
    thresholds: {
      ph:         { min: Number, max: Number, unit: String, label: String, enabled: Boolean },
      tds:        { min: Number, max: Number, unit: String, label: String, enabled: Boolean },
      waterTemp:  { min: Number, max: Number, unit: String, label: String, enabled: Boolean },
      airTemp:    { min: Number, max: Number, unit: String, label: String, enabled: Boolean },
      humidity:   { min: Number, max: Number, unit: String, label: String, enabled: Boolean },
      waterLevel: { min: Number, max: Number, unit: String, label: String, enabled: Boolean },
    },
  },
  { timestamps: true }
)

export default mongoose.models.ThresholdSetting || mongoose.model('ThresholdSetting', thresholdSchema)
