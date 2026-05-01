import { Service } from 'egg';

interface ReportItem {
  appKey: string;
  type: 'performance' | 'error' | 'api' | 'resource' | 'custom';
  data: Record<string, any>;
  timestamp: number;
  pageUrl: string;
  userAgent: string;
  userId?: string;
}

export default class ReportService extends Service {
  async processReport(items: ReportItem[]) {
    const { ctx } = this;

    const performanceItems: any[] = [];
    const errorItems: any[] = [];
    const apiItems: any[] = [];
    const resourceItems: any[] = [];
    const customItems: any[] = [];

    for (const item of items) {
      const baseFields = {
        appKey: item.appKey,
        pageUrl: item.pageUrl || item.data.pageUrl || '',
        userAgent: item.userAgent || item.data.userAgent || '',
        userId: item.userId || item.data.userId || '',
      };

      switch (item.type) {
        case 'performance':
          performanceItems.push({
            ...baseFields,
            dns: item.data.dns || 0,
            tcp: item.data.tcp || 0,
            ttfb: item.data.ttfb || 0,
            domParse: item.data.domParse || 0,
            loadTime: item.data.loadTime || 0,
            fcp: item.data.fcp || 0,
            lcp: item.data.lcp || 0,
          });
          break;

        case 'error':
          errorItems.push({
            ...baseFields,
            errorMessage: item.data.errorMessage || item.data.message || '',
            errorType: item.data.errorType || item.data.type || 'Error',
            errorStack: item.data.errorStack || item.data.stack || '',
          });
          break;

        case 'api':
          apiItems.push({
            ...baseFields,
            url: item.data.url || '',
            method: item.data.method || 'GET',
            statusCode: item.data.statusCode || 0,
            duration: item.data.duration || 0,
            success: item.data.success !== false,
          });
          break;

        case 'resource':
          resourceItems.push({
            ...baseFields,
            resourceUrl: item.data.resourceUrl || item.data.url || '',
            resourceType: item.data.resourceType || item.data.type || '',
            errorMessage: item.data.errorMessage || item.data.message || '',
          });
          break;

        case 'custom': {
          const { eventName, eventType, events, ...extraData } = item.data;

          // 处理聚合批量事件：SDK 在 customFlushInterval 窗口内汇总的多个事件
          if (eventName === '__batch__' && Array.isArray(events)) {
            for (const event of events) {
              const { eventName: batchEventName, eventType: batchEventType, ...batchExtra } = event;
              customItems.push({
                ...baseFields,
                eventName: batchEventName || 'unknown',
                eventType: batchEventType || 'custom',
                extra: batchExtra,
              });
            }
          } else {
            customItems.push({
              ...baseFields,
              eventName: eventName || 'unknown',
              eventType: eventType || 'custom',
              extra: extraData,
            });
          }
          break;
        }

        default:
          ctx.logger.warn(`Unknown report type: ${item.type}`);
      }
    }

    const insertTasks: Promise<any>[] = [];

    if (performanceItems.length > 0) {
      insertTasks.push(ctx.model.PerformanceMetric.insertMany(performanceItems));
    }
    if (errorItems.length > 0) {
      insertTasks.push(ctx.model.JsError.insertMany(errorItems));
    }
    if (apiItems.length > 0) {
      insertTasks.push(ctx.model.ApiRequest.insertMany(apiItems));
    }
    if (resourceItems.length > 0) {
      insertTasks.push(ctx.model.ResourceError.insertMany(resourceItems));
    }
    if (customItems.length > 0) {
      insertTasks.push(ctx.model.CustomEvent.insertMany(customItems));
    }

    await Promise.all(insertTasks);

    return {
      received: items.length,
      performance: performanceItems.length,
      error: errorItems.length,
      api: apiItems.length,
      resource: resourceItems.length,
      custom: customItems.length,
    };
  }
}
