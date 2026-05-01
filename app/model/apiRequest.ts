import { Application } from 'egg';
import { Schema } from 'mongoose';

export default (app: Application) => {
  const mongoose = app.mongoose;

  const ApiRequestSchema = new Schema(
    {
      appKey: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      method: {
        type: String,
        default: 'GET',
      },
      statusCode: {
        type: Number,
        default: 0,
      },
      duration: {
        type: Number,
        default: 0,
      },
      success: {
        type: Boolean,
        default: true,
      },
      pageUrl: {
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

  ApiRequestSchema.index({ appKey: 1, createdAt: -1 });
  ApiRequestSchema.index({ appKey: 1, url: 1, createdAt: -1 });

  return mongoose.model('ApiRequest', ApiRequestSchema);
};
