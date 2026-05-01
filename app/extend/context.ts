import { Context } from 'egg';

export default {
  success(this: Context, data: any = null) {
    this.body = { success: true, data, status: 200 };
  },

  fail(this: Context, statusCode: number, message: string, code?: string) {
    this.status = statusCode;
    this.body = {
      success: false,
      error: {
        code: code || 'ERROR',
        message,
      },
    };
  },
};