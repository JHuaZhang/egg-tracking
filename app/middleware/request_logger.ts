import { Context, Next } from 'egg';

export default function requestLogger() {
  return async (ctx: Context, next: Next) => {
    const startTime = Date.now();

    try {
      await next();

      if (ctx.writable === false) return;

      ctx.logger.info({
        type: 'API_SUCCESS',
        timestamp: new Date().toISOString(),
        status: ctx.status,
        path: ctx.path,
        method: ctx.method,
        duration: Date.now() - startTime,
        query: ctx.query,
        userAgent: ctx.get('user-agent'),
        ip: ctx.ip,
      });
    } catch (err) {
      ctx.logger.error('Unexpected error in request logger:', err);
      throw err;
    }
  };
}