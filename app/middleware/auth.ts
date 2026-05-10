import { Context } from 'egg';

const WHITE_LIST = [
  '/api/tracking/report',
  '/api/tracking/user/login',
  '/api/tracking/user/setup-admin',
];

export default function authMiddleware() {
  return async (ctx: Context, next: () => Promise<void>) => {
    const requestPath = ctx.path;

    const isWhitelisted = WHITE_LIST.some(path => requestPath.startsWith(path));
    if (isWhitelisted) {
      await next();
      return;
    }

    const authorization = ctx.get('Authorization');
    if (!authorization) {
      ctx.fail(401, '未登录或登录已过期');
      return;
    }

    const token = authorization.replace(/^Bearer\s+/, '');
    if (!token) {
      ctx.fail(401, '未登录或登录已过期');
      return;
    }

    const userService = (ctx as any).service.user;
    const decoded = userService.verifyToken(token);
    if (!decoded) {
      ctx.fail(401, '未登录或登录已过期');
      return;
    }

    (ctx as any).userId = decoded.userId;
    (ctx as any).email = decoded.email;
    (ctx as any).role = decoded.role;

    await next();
  };
}
