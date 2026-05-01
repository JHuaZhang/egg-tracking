import { Service } from 'egg';

export default class MetricsService extends Service {
  /** 今日指标概览 */
  async getOverview(appKey: string, date: string) {
    const { ctx } = this;
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    const prevStart = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);
    const prevEnd = new Date(endOfDay.getTime() - 24 * 60 * 60 * 1000);

    const [todayErrors, prevErrors, todayUserIds, prevUserIds] = await Promise.all([
      ctx.model.JsError.countDocuments({
        appKey,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      ctx.model.JsError.countDocuments({
        appKey,
        createdAt: { $gte: prevStart, $lte: prevEnd },
      }),
      ctx.model.JsError.distinct('userId', {
        appKey,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        userId: { $ne: '' },
      }),
      ctx.model.JsError.distinct('userId', {
        appKey,
        createdAt: { $gte: prevStart, $lte: prevEnd },
        userId: { $ne: '' },
      }),
    ]);

    const todayPv = await ctx.model.PerformanceMetric.countDocuments({
      appKey,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const errorCount = todayErrors;
    const errorPvRatio = todayPv > 0 ? Number((todayErrors / todayPv).toFixed(4)) : 0;
    const affectedUsers = todayUserIds.length;
    const totalUsers = await ctx.model.PerformanceMetric.distinct('userId', {
      appKey,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      userId: { $ne: '' },
    });
    const affectedUserRatio = totalUsers.length > 0
      ? Number((affectedUsers / totalUsers.length).toFixed(4))
      : 0;

    const errorCountChange = prevErrors > 0
      ? Number((((todayErrors - prevErrors) / prevErrors) * 100).toFixed(2))
      : 0;
    const affectedUsersChange = prevUserIds.length > 0
      ? Number((((affectedUsers - prevUserIds.length) / prevUserIds.length) * 100).toFixed(2))
      : 0;

    return {
      errorCount,
      errorPvRatio,
      affectedUsers,
      affectedUserRatio,
      errorCountChange,
      affectedUsersChange,
    };
  }

  /** 时间趋势查询 */
  async getTrend(appKey: string, startTime: string, endTime: string, granularity: string) {
    const { ctx } = this;
    const start = new Date(startTime);
    const end = new Date(endTime);

    const dateFormatMap: Record<string, string> = {
      minute: '%Y-%m-%d %H:%M',
      hour: '%Y-%m-%d %H:00',
      day: '%Y-%m-%d',
    };
    const dateFormat = dateFormatMap[granularity] || dateFormatMap.minute;

    const errorTrend = await ctx.model.JsError.aggregate([
      { $match: { appKey, createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          errorCount: { $sum: 1 },
          affectedUsers: { $addToSet: '$userId' },
        },
      },
      {
        $project: {
          time: '$_id',
          errorCount: 1,
          affectedUserCount: { $size: '$affectedUsers' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const pvTrend = await ctx.model.PerformanceMetric.aggregate([
      { $match: { appKey, createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          pvCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const pvMap = new Map(pvTrend.map((item: any) => [item._id, item.pvCount]));

    return errorTrend.map((item: any) => {
      const pvCount = pvMap.get(item._id) || 0;
      return {
        time: item.time,
        errorCount: item.errorCount,
        errorPvRatio: pvCount > 0 ? Number((item.errorCount / pvCount).toFixed(4)) : 0,
        affectedUserCount: item.affectedUserCount,
      };
    });
  }

  /** 异常排行 */
  async getErrorsTop(
    appKey: string,
    startTime: string,
    endTime: string,
    limit: number,
    groupBy?: string
  ) {
    const { ctx } = this;
    const start = new Date(startTime);
    const end = new Date(endTime);

    const groupField = groupBy === 'pageUrl' ? '$pageUrl' : '$errorMessage';

    const result = await ctx.model.JsError.aggregate([
      { $match: { appKey, createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: groupField,
          count: { $sum: 1 },
          lastOccurrence: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          content: '$_id',
          count: 1,
          lastOccurrence: 1,
        },
      },
    ]);

    // 获取近 7 日趋势
    const sevenDaysAgo = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const trendData = await ctx.model.JsError.aggregate([
      {
        $match: {
          appKey,
          createdAt: { $gte: sevenDaysAgo, $lte: end },
          [groupBy === 'pageUrl' ? 'pageUrl' : 'errorMessage']: {
            $in: result.map((item: any) => item._id),
          },
        },
      },
      {
        $group: {
          _id: {
            content: groupField,
            day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const trendMap = new Map<string, Record<string, number>>();
    for (const item of trendData) {
      const key = item._id.content;
      if (!trendMap.has(key)) {
        trendMap.set(key, {});
      }
      trendMap.get(key)![item._id.day] = item.count;
    }

    // 获取前一天数据用于计算环比
    const prevStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    const prevEnd = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    const prevData = await ctx.model.JsError.aggregate([
      { $match: { appKey, createdAt: { $gte: prevStart, $lte: prevEnd } } },
      {
        $group: {
          _id: groupField,
          count: { $sum: 1 },
        },
      },
    ]);
    const prevMap = new Map(prevData.map((item: any) => [item._id, item.count]));

    return result.map((item: any) => {
      const prevCount = prevMap.get(item._id) || 0;
      const changePercent = prevCount > 0
        ? Number((((item.count - prevCount) / prevCount) * 100).toFixed(2))
        : item.count > 0 ? 9999 : 0;

      return {
        content: item.content,
        count: item.count,
        lastOccurrence: item.lastOccurrence,
        changePercent,
        trend: trendMap.get(item._id) || {},
      };
    });
  }

  /** 错误日志详情查询 */
  async getErrorLogs(
    appKey: string,
    errorMessage: string,
    startTime: string,
    endTime: string,
    page: number,
    pageSize: number
  ) {
    const { ctx } = this;
    const start = new Date(startTime);
    const end = new Date(endTime);

    const query = {
      appKey,
      errorMessage,
      createdAt: { $gte: start, $lte: end },
    };

    const [total, logs] = await Promise.all([
      ctx.model.JsError.countDocuments(query),
      ctx.model.JsError.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ]);

    return { total, page, pageSize, logs };
  }

  /** 页面性能查询 */
  async getPerformance(appKey: string, startTime: string, endTime: string) {
    const { ctx } = this;
    const start = new Date(startTime);
    const end = new Date(endTime);

    return ctx.model.PerformanceMetric.aggregate([
      { $match: { appKey, createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$pageUrl',
          avgLoadTime: { $avg: '$loadTime' },
          avgFcp: { $avg: '$fcp' },
          avgLcp: { $avg: '$lcp' },
          avgTtfb: { $avg: '$ttfb' },
          avgDns: { $avg: '$dns' },
          avgTcp: { $avg: '$tcp' },
          avgDomParse: { $avg: '$domParse' },
          count: { $sum: 1 },
          minLoadTime: { $min: '$loadTime' },
          maxLoadTime: { $max: '$loadTime' },
        },
      },
      {
        $project: {
          pageUrl: '$_id',
          avgLoadTime: { $round: ['$avgLoadTime', 2] },
          avgFcp: { $round: ['$avgFcp', 2] },
          avgLcp: { $round: ['$avgLcp', 2] },
          avgTtfb: { $round: ['$avgTtfb', 2] },
          avgDns: { $round: ['$avgDns', 2] },
          avgTcp: { $round: ['$avgTcp', 2] },
          avgDomParse: { $round: ['$avgDomParse', 2] },
          count: 1,
          minLoadTime: 1,
          maxLoadTime: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  /** 资源异常查询 */
  async getResourceErrors(appKey: string, startTime: string, endTime: string) {
    const { ctx } = this;
    const start = new Date(startTime);
    const end = new Date(endTime);

    return ctx.model.ResourceError.aggregate([
      { $match: { appKey, createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { resourceUrl: '$resourceUrl', resourceType: '$resourceType' },
          count: { $sum: 1 },
          pageUrls: { $addToSet: '$pageUrl' },
          lastOccurrence: { $max: '$createdAt' },
        },
      },
      {
        $project: {
          resourceUrl: '$_id.resourceUrl',
          resourceType: '$_id.resourceType',
          count: 1,
          pageUrl: { $arrayElemAt: ['$pageUrls', 0] },
          affectedPages: { $size: '$pageUrls' },
          lastOccurrence: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  /** 自定义事件排行 */
  async getCustomEventsTop(
    appKey: string,
    startTime: string,
    endTime: string,
    eventType?: string
  ) {
    const { ctx } = this;
    const start = new Date(startTime);
    const end = new Date(endTime);

    const matchQuery: any = { appKey, createdAt: { $gte: start, $lte: end } };
    if (eventType) {
      matchQuery.eventType = eventType;
    }

    return ctx.model.CustomEvent.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { eventName: '$eventName', eventType: '$eventType' },
          count: { $sum: 1 },
          lastOccurrence: { $max: '$createdAt' },
          users: { $addToSet: '$userId' },
        },
      },
      {
        $project: {
          eventName: '$_id.eventName',
          eventType: '$_id.eventType',
          count: 1,
          lastOccurrence: 1,
          userCount: {
            $size: {
              $filter: { input: '$users', as: 'u', cond: { $ne: ['$u', ''] } },
            },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  /** 自定义事件详情列表 */
  async getCustomEventLogs(
    appKey: string,
    eventName: string,
    startTime: string,
    endTime: string,
    page: number,
    pageSize: number
  ) {
    const { ctx } = this;
    const start = new Date(startTime);
    const end = new Date(endTime);

    const query = {
      appKey,
      eventName,
      createdAt: { $gte: start, $lte: end },
    };

    const [total, logs] = await Promise.all([
      ctx.model.CustomEvent.countDocuments(query),
      ctx.model.CustomEvent.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ]);

    return { total, page, pageSize, logs };
  }

  /** API 请求性能查询 */
  async getApiMetrics(appKey: string, startTime: string, endTime: string) {
    const { ctx } = this;
    const start = new Date(startTime);
    const end = new Date(endTime);

    return ctx.model.ApiRequest.aggregate([
      { $match: { appKey, createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { url: '$url', method: '$method' },
          totalCount: { $sum: 1 },
          successCount: { $sum: { $cond: ['$success', 1, 0] } },
          avgDuration: { $avg: '$duration' },
          maxDuration: { $max: '$duration' },
          slowCount: { $sum: { $cond: [{ $gt: ['$duration', 3000] }, 1, 0] } },
        },
      },
      {
        $project: {
          url: '$_id.url',
          method: '$_id.method',
          totalCount: 1,
          successCount: 1,
          successRate: {
            $round: [{ $multiply: [{ $divide: ['$successCount', '$totalCount'] }, 100] }, 2],
          },
          avgDuration: { $round: ['$avgDuration', 2] },
          maxDuration: 1,
          slowRate: {
            $round: [{ $multiply: [{ $divide: ['$slowCount', '$totalCount'] }, 100] }, 2],
          },
        },
      },
      { $sort: { totalCount: -1 } },
    ]);
  }
}
