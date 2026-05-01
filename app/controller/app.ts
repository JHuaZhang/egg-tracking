import { Controller } from 'egg';
import type AppService from '../service/app';

export default class AppController extends Controller {
  private get appService(): AppService {
    return (this.ctx as any).service.app;
  }

  async create() {
    const { ctx } = this;
    const { name, description = '' } = ctx.request.body;

    if (!name) {
      ctx.fail(400, 'App name is required');
      return;
    }

    const appRecord = await this.appService.create(name, description);
    ctx.success(appRecord);
  }

  async list() {
    const { ctx } = this;
    const apps = await this.appService.list();
    ctx.success(apps);
  }

  async detail() {
    const { ctx } = this;
    const id = ctx.params!.id as string;
    const appRecord = await this.appService.detail(id);
    ctx.success(appRecord);
  }

  async update() {
    const { ctx } = this;
    const id = ctx.params!.id as string;
    const { name, description } = ctx.request.body;
    const appRecord = await this.appService.update(id, { name, description });
    ctx.success(appRecord);
  }

  async remove() {
    const { ctx } = this;
    const id = ctx.params!.id as string;
    const appRecord = await this.appService.remove(id);
    ctx.success(appRecord);
  }
}
