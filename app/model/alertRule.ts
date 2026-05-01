import { Application } from 'egg';
import { Schema } from 'mongoose';

export default (app: Application) => {
  const mongoose = app.mongoose;

  const AlertRuleSchema = new Schema(
    {
      appKey: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      metricType: {
        type: String,
        required: true,
        enum: ['error_count', 'page_load_time', 'api_duration', 'api_success_rate'],
      },
      operator: {
        type: String,
        required: true,
        enum: ['gt', 'gte', 'lt', 'lte', 'eq'],
      },
      threshold: {
        type: Number,
        required: true,
      },
      checkInterval: {
        type: Number,
        default: 5,
      },
      enabled: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

  AlertRuleSchema.index({ appKey: 1 });

  return mongoose.model('AlertRule', AlertRuleSchema);
};
