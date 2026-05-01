import { Service } from 'egg';

interface AlertRuleData {
  appKey: string;
  name: string;
  metricType: string;
  operator: string;
  threshold: number;
  checkInterval?: number;
  enabled?: boolean;
}

export default class AlertService extends Service {
  async create(data: AlertRuleData) {
    const { ctx } = this;
    return ctx.model.AlertRule.create(data);
  }

  async list(appKey: string) {
    const { ctx } = this;
    return ctx.model.AlertRule.find({ appKey }).sort({ createdAt: -1 });
  }

  async update(id: string, data: Partial<AlertRuleData>) {
    const { ctx } = this;
    const rule = await ctx.model.AlertRule.findByIdAndUpdate(id, data, { new: true });
    if (!rule) {
      ctx.throw(404, 'Alert rule not found');
    }
    return rule;
  }

  async remove(id: string) {
    const { ctx } = this;
    const rule = await ctx.model.AlertRule.findByIdAndDelete(id);
    if (!rule) {
      ctx.throw(404, 'Alert rule not found');
    }
    return rule;
  }
}
