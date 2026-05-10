import { Service } from 'egg';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = 'tracking-platform-jwt-secret-key';
const JWT_EXPIRES_IN = '7d';

export default class UserService extends Service {
  private get userModel() {
    return (this.ctx.model as any).User;
  }

  /** 创建超级管理员（仅允许创建一个，需要 setup secret） */
  async setupAdmin(email: string, password: string, secret: string) {
    const configSecret = process.env.SETUP_SECRET;
    if (!configSecret || secret !== configSecret) {
      return { notFound: true };
    }

    const existingAdmin = await this.userModel.findOne({ role: 'admin' });
    if (existingAdmin) {
      return { notFound: true };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await this.userModel.create({
      email,
      passwordHash,
      role: 'admin',
      mustChangePassword: false,
      allowedApps: [],
    });

    const token = this.signToken(admin._id.toString(), admin.email, admin.role);
    return {
      token,
      userInfo: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        mustChangePassword: false,
        allowedApps: [],
      },
    };
  }

  /** 登录 */
  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      return { error: '邮箱或密码错误' };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return { error: '邮箱或密码错误' };
    }

    const token = this.signToken(user._id.toString(), user.email, user.role);
    return {
      token,
      userInfo: {
        id: user._id,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        allowedApps: user.allowedApps,
      },
    };
  }

  /** 修改密码 */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return { error: '用户不存在' };
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return { error: '原密码错误' };
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    return { success: true };
  }

  /** 管理员创建用户（默认密码 123456） */
  async createUser(email: string) {
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      return { error: '该邮箱已存在' };
    }

    const passwordHash = await bcrypt.hash('123456', 10);
    const user = await this.userModel.create({
      email,
      passwordHash,
      role: 'user',
      mustChangePassword: true,
      allowedApps: [],
    });

    return {
      id: user._id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      allowedApps: user.allowedApps,
    };
  }

  /** 管理员获取用户列表 */
  async listUsers() {
    const users = await this.userModel.find({}).select('email role mustChangePassword allowedApps createdAt').sort({ createdAt: -1 });
    return users;
  }

  /** 管理员删除用户 */
  async deleteUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return { error: '用户不存在' };
    }
    if (user.role === 'admin') {
      return { error: '不能删除管理员账号' };
    }
    await this.userModel.findByIdAndDelete(userId);
    return { success: true };
  }

  /** 管理员分配应用权限 */
  async updateUserApps(userId: string, allowedApps: string[]) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return { error: '用户不存在' };
    }
    user.allowedApps = allowedApps;
    await user.save();
    return {
      id: user._id,
      email: user.email,
      allowedApps: user.allowedApps,
    };
  }

  /** 获取当前用户信息 */
  async getUserInfo(userId: string) {
    const user = await this.userModel.findById(userId).select('email role mustChangePassword allowedApps');
    if (!user) {
      return null;
    }
    return {
      id: user._id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      allowedApps: user.allowedApps,
    };
  }

  /** 校验用户是否有权限访问某个 appKey */
  async checkAppPermission(userId: string, appKey: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).select('role allowedApps');
    if (!user) return false;
    if (user.role === 'admin') return true;

    const app = await (this.ctx.model as any).App.findOne({ appKey }).select('_id');
    if (!app) return false;

    return user.allowedApps.includes(app._id.toString());
  }

  /** 获取用户可访问的应用列表 */
  async getAllowedAppKeys(userId: string): Promise<string[] | 'all'> {
    const user = await this.userModel.findById(userId).select('role allowedApps');
    if (!user) return [];
    if (user.role === 'admin') return 'all';

    const apps = await (this.ctx.model as any).App.find({
      _id: { $in: user.allowedApps },
    }).select('appKey');
    return apps.map((a: any) => a.appKey);
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    } catch {
      return null;
    }
  }

  private signToken(userId: string, email: string, role: string) {
    return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }
}
