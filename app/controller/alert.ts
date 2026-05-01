import { Controller } from 'egg';
import type AlertService from '../service/alert';

export default class AlertController extends Controller {
  private get alertService(): AlertService {
    return (this.ctx as any).service.alert;
  }

  async create() {
    const { ctx } = this;
    const { appKey, name, metricType, operator, threshold, checkInterval, enabled } =
      ctx.request.body;

    if (!appKey || !name || !metricType || !operator || threshold === undefined) {
      ctx.fail(400, 'appKey, name, metricType, operator and threshold are required');
      return;
    }

    const rule = await this.alertService.create({
      appKey,
      name,
      metricType,
      operator,
      threshold,
      checkInterval,
      enabled,
    });
    ctx.success(rule);
  }

  async list() {
    const { ctx } = this;
    const { appKey } = ctx.query;

    if (!appKey) {
      ctx.fail(400, 'appKey is required');
      return;
    }

    const rules = await this.alertService.list(appKey);
    ctx.success(rules);
  }

  async update() {
    const { ctx } = this;
    const id = ctx.params!.id as string;
    const data = ctx.request.body;
    const rule = await this.alertService.update(id, data);
    ctx.success(rule);
  }

  async remove() {
    const { ctx } = this;
    const id = ctx.params!.id as string;
    const rule = await this.alertService.remove(id);
    ctx.success(rule);
  }
}
