import { Application, IBoot } from 'egg';
import { ConnectionStates } from 'mongoose';
import os from 'os';

class AppBootHook implements IBoot {
  app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  async serverDidReady() {
    const server = this.app.server;
    if (!server) {
      this.app.logger.error('❌ 服务器实例未找到');
      return;
    }
    const port = this.app.config.cluster?.listen?.port || 7002;
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : port;
    this.printServerInfo(actualPort);
  }

  private printServerInfo(port: number) {
    const localIP = this.getLocalIP();
    this.app.logger.info('\n');
    this.app.logger.info('🚀 Tracking Platform 服务已启动！');
    this.app.logger.info('🌐 可通过以下地址访问:');
    this.app.logger.info(`🔹本地访问: http://localhost:${port}`);
    this.app.logger.info(`🔹局域网访问: http://${localIP}:${port}`);
    this.app.logger.info('');
  }

  private getLocalIP(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) continue;
      for (const entry of iface) {
        if (entry.family === 'IPv4' && !entry.internal) {
          return entry.address;
        }
      }
    }
    return 'localhost';
  }

  async didReady() {
    const conn = this.app.mongoose.connection;
    const stateMap: Record<ConnectionStates, string> = {
      [ConnectionStates.disconnected]: '已断开连接',
      [ConnectionStates.connected]: '已连接',
      [ConnectionStates.connecting]: '连接中',
      [ConnectionStates.disconnecting]: '断开连接中',
      [ConnectionStates.uninitialized]: '未初始化',
    };
    const stateName = stateMap[conn.readyState] || '未知状态';
    this.app.logger.info(`📊 MongoDB 连接状态: ${stateName} (代码: ${conn.readyState})`);

    if (conn.readyState === ConnectionStates.connected) {
      this.app.logger.info('✅ MongoDB 已成功连接');
      conn
        .on('connected', () => this.app.logger.info('🔌 MongoDB 重新连接成功'))
        .on('disconnected', () => this.app.logger.warn('⚠️ MongoDB 连接断开'))
        .on('error', (err) => this.app.logger.error(`❌ MongoDB 连接错误: ${err.message}`));

      if (!conn.db) {
        this.app.logger.error('❌ 数据库对象不可用');
        return;
      }
      try {
        const adminDb = conn.db.admin();
        if (!adminDb) {
          this.app.logger.error('❌ 无法访问 admin 数据库');
          return;
        }
        const dbInfo = await adminDb.serverInfo();
        this.app.logger.info(`🗃️ MongoDB 版本: ${dbInfo.version}`);
        this.app.logger.info(`📊 数据库名称: ${conn.db.databaseName}`);
        try {
          const stats = await conn.db.stats();
          this.app.logger.info(`📈 数据库大小: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
          this.app.logger.info(`📚 集合数量: ${stats.collections}`);
        } catch (statsError) {
          const err = statsError as Error;
          this.app.logger.warn(`⚠️ 无法获取数据库统计信息: ${err.message}`);
        }
      } catch (error) {
        const err = error as Error;
        this.app.logger.error(`❌ MongoDB 健康检查失败: ${err.message}`);
      }
    } else {
      this.app.logger.warn(`⚠️ MongoDB 未连接! 当前状态: ${stateName}`);
      try {
        this.app.logger.info('🔄 尝试重新连接 MongoDB...');
        await conn.asPromise();
        this.app.logger.info('✅ MongoDB 重新连接成功!');
      } catch (reconnectError) {
        const err = reconnectError as Error;
        this.app.logger.error(`❌ MongoDB 重连失败: ${err.message}`);
      }
    }
  }
}

export default AppBootHook;