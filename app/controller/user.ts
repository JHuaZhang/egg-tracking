import { Controller } from 'egg';

export default class UserController extends Controller {
  private get userService() {
    return (this.ctx as any).service.user;
  }

  /** 初始化超级管理员（一次性接口，需 setup secret，超管已存在则返回404） */
  async setupAdmin() {
    const { ctx } = this;
    const { email, password, secret } = ctx.request.body;

    if (!email || !password || !secret) {
      ctx.status = 404;
      ctx.body = { message: 'Not Found' };
      return;
    }

    if (password.length < 6) {
      ctx.status = 404;
      ctx.body = { message: 'Not Found' };
      return;
    }

    const result = await this.userService.setupAdmin(email, password, secret);
    if (result.notFound) {
      ctx.status = 404;
      ctx.body = { message: 'Not Found' };
      return;
    }

    ctx.success(result);
  }

  /** 登录 */
  async login() {
    const { ctx } = this;
    const { email, password } = ctx.request.body;

    if (!email || !password) {
      ctx.fail(400, '邮箱和密码不能为空');
      return;
    }

    const result = await this.userService.login(email, password);
    if (result.error) {
      ctx.fail(401, result.error);
      return;
    }

    ctx.success(result);
  }

  /** 获取当前用户信息 */
  async info() {
    const { ctx } = this;
    const userId = (ctx as any).userId;

    if (!userId) {
      ctx.fail(401, '未登录或登录已过期');
      return;
    }

    const userInfo = await this.userService.getUserInfo(userId);
    if (!userInfo) {
      ctx.fail(401, '用户不存在');
      return;
    }

    ctx.success(userInfo);
  }

  /** 修改密码 */
  async changePassword() {
    const { ctx } = this;
    const userId = (ctx as any).userId;
    const { oldPassword, newPassword } = ctx.request.body;

    if (!oldPassword || !newPassword) {
      ctx.fail(400, '原密码和新密码不能为空');
      return;
    }

    if (newPassword.length < 6) {
      ctx.fail(400, '新密码长度不能少于6位');
      return;
    }

    const result = await this.userService.changePassword(userId, oldPassword, newPassword);
    if (result.error) {
      ctx.fail(400, result.error);
      return;
    }

    ctx.success(result);
  }

  /** 管理员：创建用户 */
  async createUser() {
    const { ctx } = this;
    const role = (ctx as any).role;

    if (role !== 'admin') {
      ctx.fail(403, '无权限执行此操作');
      return;
    }

    const { email } = ctx.request.body;
    if (!email) {
      ctx.fail(400, '邮箱不能为空');
      return;
    }

    const result = await this.userService.createUser(email);
    if (result.error) {
      ctx.fail(400, result.error);
      return;
    }

    ctx.success(result);
  }

  /** 管理员：获取用户列表 */
  async listUsers() {
    const { ctx } = this;
    const role = (ctx as any).role;

    if (role !== 'admin') {
      ctx.fail(403, '无权限执行此操作');
      return;
    }

    const users = await this.userService.listUsers();
    ctx.success(users);
  }

  /** 管理员：删除用户 */
  async deleteUser() {
    const { ctx } = this;
    const role = (ctx as any).role;

    if (role !== 'admin') {
      ctx.fail(403, '无权限执行此操作');
      return;
    }

    const userId = ctx.params!.id as string;
    const result = await this.userService.deleteUser(userId);
    if (result.error) {
      ctx.fail(400, result.error);
      return;
    }

    ctx.success(result);
  }

  /** 管理员：更新用户应用权限 */
  async updateUserApps() {
    const { ctx } = this;
    const role = (ctx as any).role;

    if (role !== 'admin') {
      ctx.fail(403, '无权限执行此操作');
      return;
    }

    const userId = ctx.params!.id as string;
    const { allowedApps } = ctx.request.body;

    if (!Array.isArray(allowedApps)) {
      ctx.fail(400, 'allowedApps 必须是数组');
      return;
    }

    const result = await this.userService.updateUserApps(userId, allowedApps);
    if (result.error) {
      ctx.fail(400, result.error);
      return;
    }

    ctx.success(result);
  }
}
