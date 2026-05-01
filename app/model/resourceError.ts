import { Application } from 'egg';
import { Schema } from 'mongoose';

export default (app: Application) => {
  const mongoose = app.mongoose;

  const ResourceErrorSchema = new Schema(
    {
      appKey: {
        type: String,
        required: true,
      },
      resourceUrl: {
        type: String,
        required: true,
      },
      resourceType: {
        type: String,
        default: '',
      },
      pageUrl: {
        type: String,
        default: '',
      },
      errorMessage: {
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

  ResourceErrorSchema.index({ appKey: 1, createdAt: -1 });

  return mongoose.model('ResourceError', ResourceErrorSchema);
};
