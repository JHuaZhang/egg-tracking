import { Application } from 'egg';
import { Schema } from 'mongoose';

export default (app: Application) => {
  const mongoose = app.mongoose;

  const JsErrorSchema = new Schema(
    {
      appKey: {
        type: String,
        required: true,
      },
      errorMessage: {
        type: String,
        required: true,
      },
      errorType: {
        type: String,
        default: 'Error',
      },
      errorStack: {
        type: String,
        default: '',
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
    },
    {
      timestamps: true,
    }
  );

  JsErrorSchema.index({ appKey: 1, createdAt: -1 });
  JsErrorSchema.index({ appKey: 1, errorMessage: 1, createdAt: -1 });

  return mongoose.model('JsError', JsErrorSchema);
};
