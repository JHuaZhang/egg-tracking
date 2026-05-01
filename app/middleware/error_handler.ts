import { Context, Next } from 'egg';

export default function errorHandler() {
  return async (ctx: Context, next: Next) => {
    try {
      await next();
    } catch (err: any) {
      const status = err.status || 500;
      const message = err.message || '服务器内部错误';
      const code = err.code || 'INTERNAL_ERROR';

      ctx.logger.error('[ErrorHandler]', err);

      ctx.status = status;
      ctx.body = {
        success: false,
        error: {
          code,
          message: status === 500 ? '服务器内部错误' : message,
        },
      };
    }
  };
}