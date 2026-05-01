import { Application } from 'egg';
import { Schema } from 'mongoose';

export default (app: Application) => {
  const mongoose = app.mongoose;

  const AppSchema = new Schema(
    {
      appKey: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
      description: {
        type: String,
        default: '',
      },
      members: [
        {
          type: String,
        },
      ],
    },
    {
      timestamps: true,
    }
  );

  return mongoose.model('App', AppSchema);
};
