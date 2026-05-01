import { Application } from 'egg';
import { Schema } from 'mongoose';

export default (app: Application) => {
  const mongoose = app.mongoose;

  const PerformanceMetricSchema = new Schema(
    {
      appKey: {
        type: String,
        required: true,
      },
      pageUrl: {
        type: String,
        required: true,
      },
      dns: { type: Number, default: 0 },
      tcp: { type: Number, default: 0 },
      ttfb: { type: Number, default: 0 },
      domParse: { type: Number, default: 0 },
      loadTime: { type: Number, default: 0 },
      fcp: { type: Number, default: 0 },
      lcp: { type: Number, default: 0 },
      userAgent: { type: String, default: '' },
      userId: { type: String, default: '' },
    },
    {
      timestamps: true,
    }
  );

  PerformanceMetricSchema.index({ appKey: 1, createdAt: -1 });
  PerformanceMetricSchema.index({ appKey: 1, pageUrl: 1, createdAt: -1 });

  return mongoose.model('PerformanceMetric', PerformanceMetricSchema);
};
