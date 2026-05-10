import { Controller } from 'egg';

export default class MetricsController extends Controller {
  /** 检查当前用户是否有权限访问指定 appKey 的应用 */
  private async checkAppAccess(appKey: string): Promise<boolean> {
    const { ctx } = this;
    const userId = (ctx as any).userId;
    const role = (ctx as any).role;
    if (role === 'admin') return true;
    const hasAccess = await (ctx.service as any).user.checkAppPermission(userId, appKey);
    return hasAccess;
  }

  async overview() {
    const { ctx } = this;
    const { appKey, date } = ctx.query;

    if (!appKey) {
      ctx.fail(400, 'appKey is required');
      return;
    }

    if (!await this.checkAppAccess(appKey)) {
      ctx.fail(403, '无权限访问该应用');
      return;
    }

    const queryDate = date || new Date().toISOString().split('T')[0];
    const result = await ctx.service.metrics.getOverview(appKey, queryDate);
    ctx.success(result);
  }

  async trend() {
    const { ctx } = this;
    const { appKey, startTime, endTime, granularity = 'minute' } = ctx.query;

    if (!appKey || !startTime || !endTime) {
      ctx.fail(400, 'appKey, startTime and endTime are required');
      return;
    }

    if (!await this.checkAppAccess(appKey)) {
      ctx.fail(403, '无权限访问该应用');
      return;
    }

    const result = await ctx.service.metrics.getTrend(appKey, startTime, endTime, granularity);
    ctx.success(result);
  }

  async errorsTop() {
    const { ctx } = this;
    const { appKey, startTime, endTime, limit = '200', groupBy } = ctx.query;

    if (!appKey || !startTime || !endTime) {
      ctx.fail(400, 'appKey, startTime and endTime are required');
      return;
    }

    if (!await this.checkAppAccess(appKey)) {
      ctx.fail(403, '无权限访问该应用');
      return;
    }

    const result = await ctx.service.metrics.getErrorsTop(
      appKey,
      startTime,
      endTime,
      parseInt(limit, 10),
      groupBy
    );
    ctx.success(result);
  }

  async errorLogs() {
    const { ctx } = this;
    const { appKey, errorMessage, startTime, endTime, page = '1', pageSize = '20' } = ctx.query;

    if (!appKey || !errorMessage || !startTime || !endTime) {
      ctx.fail(400, 'appKey, errorMessage, startTime and endTime are required');
      return;
    }

    if (!await this.checkAppAccess(appKey)) {
      ctx.fail(403, '无权限访问该应用');
      return;
    }

    const result = await ctx.service.metrics.getErrorLogs(
      appKey,
      errorMessage,
      startTime,
      endTime,
      parseInt(page, 10),
      parseInt(pageSize, 10)
    );
    ctx.success(result);
  }

  async performance() {
    const { ctx } = this;
    const { appKey, startTime, endTime } = ctx.query;

    if (!appKey || !startTime || !endTime) {
      ctx.fail(400, 'appKey, startTime and endTime are required');
      return;
    }

    if (!await this.checkAppAccess(appKey)) {
      ctx.fail(403, '无权限访问该应用');
      return;
    }

    const result = await ctx.service.metrics.getPerformance(appKey, startTime, endTime);
    ctx.success(result);
  }

  async resourceErrors() {
    const { ctx } = this;
    const { appKey, startTime, endTime } = ctx.query;

    if (!appKey || !startTime || !endTime) {
      ctx.fail(400, 'appKey, startTime and endTime are required');
      return;
    }

    if (!await this.checkAppAccess(appKey)) {
      ctx.fail(403, '无权限访问该应用');
      return;
    }

    const result = await ctx.service.metrics.getResourceErrors(appKey, startTime, endTime);
    ctx.success(result);
  }

  async apiMetrics() {
    const { ctx } = this;
    const { appKey, startTime, endTime } = ctx.query;

    if (!appKey || !startTime || !endTime) {
      ctx.fail(400, 'appKey, startTime and endTime are required');
      return;
    }

    if (!await this.checkAppAccess(appKey)) {
      ctx.fail(403, '无权限访问该应用');
      return;
    }

    const result = await ctx.service.metrics.getApiMetrics(appKey, startTime, endTime);
    ctx.success(result);
  }

  async customEventsTop() {
    const { ctx } = this;
    const { appKey, startTime, endTime, eventType } = ctx.query;

    if (!appKey || !startTime || !endTime) {
      ctx.fail(400, 'appKey, startTime and endTime are required');
      return;
    }

    if (!await this.checkAppAccess(appKey)) {
      ctx.fail(403, '无权限访问该应用');
      return;
    }

    const result = await ctx.service.metrics.getCustomEventsTop(
      appKey,
      startTime,
      endTime,
      eventType
    );
    ctx.success(result);
  }

  async customEventLogs() {
    const { ctx } = this;
    const { appKey, eventName, startTime, endTime, page = '1', pageSize = '20' } = ctx.query;

    if (!appKey || !eventName || !startTime || !endTime) {
      ctx.fail(400, 'appKey, eventName, startTime and endTime are required');
      return;
    }

    if (!await this.checkAppAccess(appKey)) {
      ctx.fail(403, '无权限访问该应用');
      return;
    }

    const result = await ctx.service.metrics.getCustomEventLogs(
      appKey,
      eventName,
      startTime,
      endTime,
      parseInt(page, 10),
      parseInt(pageSize, 10)
    );
    ctx.success(result);
  }
}
