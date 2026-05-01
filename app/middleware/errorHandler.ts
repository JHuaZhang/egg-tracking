import { Context, Next } from 'egg';

export default function errorHandler() {
  return async (ctx: Context, next: Next) => {
    try {
      await next();
    } catch (err: any) {
      const status = err.status || 500;
      const message = status === 500 ? 'Internal Server Error' : err.message;

      ctx.logger.error('[errorHandler]', err);

      ctx.status = status;
      ctx.body = {
        success: false,
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message,
        },
      };
    }
  };
}
