import { ConnectOptions } from 'mongoose';

export interface DatabaseConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  dbName?: string;
  options?: ConnectOptions;
}

export const getDatabaseConfig = (env: string | undefined): DatabaseConfig => {
  const configs: Record<string, DatabaseConfig> = {
    development: {
      host: '127.0.0.1',
      port: 27017,
      dbName: 'tracking_platform',
    },
    production: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '27017', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      dbName: process.env.DB_NAME || 'tracking_platform',
      options: {
        authSource: 'admin',
        ...(process.env.DB_OPTIONS ? JSON.parse(process.env.DB_OPTIONS) : {}),
      },
    },
  };
  if (!env) {
    env = 'development';
  }
  return configs[env] || configs.development;
};

export const buildMongoUrl = (config: DatabaseConfig): string => {
  const credentials =
    config.user && config.password
      ? `${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@`
      : '';

  return `mongodb://${credentials}${config.host}:${config.port}/${config.dbName}`;
};