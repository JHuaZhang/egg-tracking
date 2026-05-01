import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import { getDatabaseConfig, buildMongoUrl } from './db';
require('dotenv').config();

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;

  config.keys = process.env.EGG_KEYS || 'tracking-platform-20260420';

  const env = process.env.DATE_BASE_ENV || process.env.NODE_ENV;
  const dbConfig = getDatabaseConfig(env);

  config.mongoose = {
    client: {
      url: buildMongoUrl(dbConfig),
      options: dbConfig.options,
    },
  };

  config.cluster = {
    listen: {
      port: 7002,
      hostname: '0.0.0.0',
    },
  };

  config.multipart = {
    mode: 'file',
  };

  config.security = {
    csrf: {
      enable: false,
    },
  };

  config.middleware = ['errorHandler', 'requestLogger'];

  config.cors = {
    origin(ctx) {
      return ctx.get('origin') || '*';
    },
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
    allowHeaders: 'Content-Type,Authorization,Accept,X-Requested-With',
    credentials: true,
  };

  config.bodyParser = {
    jsonLimit: '5mb',
    formLimit: '5mb',
    textLimit: '5mb',
    enableTypes: ['json', 'form', 'text'],
  };

  const bizConfig = {
    sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,
  };

  return {
    ...config,
    bizConfig,
  };
};