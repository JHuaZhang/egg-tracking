import { Application } from 'egg';
import { Schema } from 'mongoose';

export default (app: Application) => {
  const mongoose = app.mongoose;

  const UserSchema = new Schema(
    {
      email: {
        type: String,
        required: true,
        unique: true,
      },
      passwordHash: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',
      },
      mustChangePassword: {
        type: Boolean,
        default: false,
      },
      allowedApps: {
        type: [String],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  );

  UserSchema.index({ email: 1 }, { unique: true });

  return mongoose.model('User', UserSchema);
};
