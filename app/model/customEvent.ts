import { Application } from 'egg';
import { Schema } from 'mongoose';

export default (app: Application) => {
  const mongoose = app.mongoose;

  const CustomEventSchema = new Schema(
    {
      appKey: {
        type: String,
        required: true,
      },
      eventName: {
        type: String,
        required: true,
      },
      eventType: {
        type: String,
        default: 'custom',
      },
      pageUrl: {
        type: String,
        default: '',
      },
      userAgent: {
        type: String,
        default: '',
      },
      userId: {
        type: String,
        default: '',
      },
      extra: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    {
      timestamps: true,
    }
  );

  CustomEventSchema.index({ appKey: 1, createdAt: -1 });
  CustomEventSchema.index({ appKey: 1, eventName: 1, createdAt: -1 });
  CustomEventSchema.index({ appKey: 1, eventType: 1, createdAt: -1 });

  return mongoose.model('CustomEvent', CustomEventSchema);
};
