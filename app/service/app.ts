import { Service } from 'egg';
import { v4 as uuidv4 } from 'uuid';

export default class AppService extends Service {
  async create(name: string, description: string) {
    const { ctx } = this;
    const existing = await ctx.model.App.findOne({ name });
    if (existing) {
      ctx.throw(409, 'App name already exists');
    }
    const appKey = uuidv4().replace(/-/g, '');
    const appRecord = await ctx.model.App.create({
      appKey,
      name,
      description,
    });
    return appRecord;
  }

  async list() {
    const { ctx } = this;
    return ctx.model.App.find().sort({ createdAt: -1 });
  }

  async detail(id: string) {
    const { ctx } = this;
    const appRecord = await ctx.model.App.findById(id);
    if (!appRecord) {
      ctx.throw(404, 'App not found');
    }
    return appRecord;
  }

  async update(id: string, data: { name?: string; description?: string }) {
    const { ctx } = this;
    const appRecord = await ctx.model.App.findByIdAndUpdate(id, data, { new: true });
    if (!appRecord) {
      ctx.throw(404, 'App not found');
    }
    return appRecord;
  }

  async remove(id: string) {
    const { ctx } = this;
    const appRecord = await ctx.model.App.findByIdAndDelete(id);
    if (!appRecord) {
      ctx.throw(404, 'App not found');
    }
    // 删除关联的监控数据
    const { appKey } = appRecord;
    await Promise.all([
      ctx.model.PerformanceMetric.deleteMany({ appKey }),
      ctx.model.JsError.deleteMany({ appKey }),
      ctx.model.ApiRequest.deleteMany({ appKey }),
      ctx.model.ResourceError.deleteMany({ appKey }),
      ctx.model.AlertRule.deleteMany({ appKey }),
    ]);
    return appRecord;
  }

  async findByAppKey(appKey: string) {
    const { ctx } = this;
    return ctx.model.App.findOne({ appKey });
  }

  async validateAppKey(appKey: string): Promise<boolean> {
    const appRecord = await this.findByAppKey(appKey);
    return !!appRecord;
  }
}
