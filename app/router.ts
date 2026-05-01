import { Application } from 'egg';

module.exports = (app: Application) => {
  const { router, controller } = app;

  router.prefix('/api/tracking');

  /** 应用管理接口 */
  router.post('/apps', controller.app.create);
  router.get('/apps', controller.app.list);
  router.get('/apps/:id', controller.app.detail);
  router.put('/apps/:id', controller.app.update);
  router.delete('/apps/:id', controller.app.remove);

  /** 数据上报接口 */
  router.post('/report', controller.report.report);

  /** 数据查询接口 */
  router.get('/metrics/overview', controller.metrics.overview);
  router.get('/metrics/trend', controller.metrics.trend);
  router.get('/metrics/errors/top', controller.metrics.errorsTop);
  router.get('/metrics/errors/logs', controller.metrics.errorLogs);
  router.get('/metrics/performance', controller.metrics.performance);
  router.get('/metrics/api', controller.metrics.apiMetrics);
  router.get('/metrics/resource', controller.metrics.resourceErrors);
  router.get('/metrics/custom/top', controller.metrics.customEventsTop);
  router.get('/metrics/custom/logs', controller.metrics.customEventLogs);

  /** 告警规则接口 */
  router.post('/alerts', controller.alert.create);
  router.get('/alerts', controller.alert.list);
  router.put('/alerts/:id', controller.alert.update);
  router.delete('/alerts/:id', controller.alert.remove);
};