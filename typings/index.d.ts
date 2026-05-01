/// <reference path="../node_modules/egg-mongoose/index.d.ts" />

import { Server } from 'http';
import { Model } from 'mongoose';

declare module 'egg' {
  interface Application {
    server: Server;
  }

  interface Context {
    service: {
      app: any;
      report: any;
      metrics: any;
      alert: any;
      [key: string]: any;
    };
    params: {
      id?: string;
      [key: string]: any;
    };
    fail(statusCode: number, message: string, code?: string): void;
    success(data?: any): void;
  }

  interface EggAppConfig {
    bodyParser: {
      jsonLimit: string;
      formLimit: string;
      textLimit: string;
      enableTypes: string[];
    };
  }
}
