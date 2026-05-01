import { Context, Next } from 'egg';

export default function requestLogger() {
  return async (ctx: Context, next: Next) => {
    const startTime = Date.now();
    await next();
    const duration = Date.now() - startTime;
    ctx.logger.info(`[${ctx.method}] ${ctx.url} - ${ctx.status} (${duration}ms)`);
  };
}
