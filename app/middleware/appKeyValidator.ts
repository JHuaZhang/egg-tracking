import { Context, Next } from 'egg';

export default function appKeyValidator() {
  return async (ctx: Context, next: Next) => {
    const body = ctx.request.body;
    let appKey: string | undefined;

    if (Array.isArray(body)) {
      appKey = body[0]?.appKey;
    } else {
      appKey = body?.appKey;
    }

    if (!appKey) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: { code: 'MISSING_APP_KEY', message: 'appKey is required' },
      };
      return;
    }

    const isValid = await (ctx.service as any).app.validateAppKey(appKey);
    if (!isValid) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: { code: 'INVALID_APP_KEY', message: 'Invalid appKey' },
      };
      return;
    }

    await next();
  };
}
