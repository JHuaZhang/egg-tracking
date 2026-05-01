import { Controller } from 'egg';
import type AppService from '../service/app';
import type ReportService from '../service/report';

export default class ReportController extends Controller {
  private get appService(): AppService {
    return (this.ctx as any).service.app;
  }

  private get reportService(): ReportService {
    return (this.ctx as any).service.report;
  }

  async report() {
    const { ctx } = this;
    let body = ctx.request.body;

    // 支持 Beacon 格式（text/plain）
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        ctx.fail(400, 'Invalid JSON format');
        return;
      }
    }

    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      ctx.fail(400, 'No report data provided');
      return;
    }

    // 校验 appKey
    const appKey = items[0]?.appKey;
    if (!appKey) {
      ctx.fail(400, 'appKey is required');
      return;
    }

    const isValid = await this.appService.validateAppKey(appKey);
    if (!isValid) {
      ctx.fail(400, 'Invalid appKey');
      return;
    }

    const result = await this.reportService.processReport(items);
    ctx.success(result);
  }
}
