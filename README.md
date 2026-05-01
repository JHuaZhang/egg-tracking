# egg-tracking

前端监控平台 Egg.js 后端服务，提供数据上报、指标查询、应用管理、告警规则等 API。

## 技术栈

- **框架**：Egg.js 4 + TypeScript
- **数据库**：MongoDB（egg-mongoose）
- **端口**：7002

## 启动

```bash
pnpm install
pnpm run dev        # 开发环境（http://localhost:7002）
pnpm run build      # 编译 TypeScript
pnpm run start      # 生产环境启动
```

---

## API 接口文档

所有接口统一前缀：**`/api/tracking`**

统一响应格式：

```json
// 成功
{ "success": true, "data": { ... } }

// 失败
{ "success": false, "message": "错误信息", "code": "ERROR_CODE" }
```

---

### 一、应用管理

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/apps` | 创建应用 |
| `GET` | `/apps` | 应用列表 |
| `GET` | `/apps/:id` | 应用详情 |
| `PUT` | `/apps/:id` | 更新应用 |
| `DELETE` | `/apps/:id` | 删除应用 |

#### POST /apps — 创建应用

**请求 Body**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 应用名称 |
| `description` | string | ❌ | 应用描述 |

**响应示例**：

```json
{
  "success": true,
  "data": {
    "_id": "663f...",
    "name": "我的应用",
    "appKey": "0c15734916d2413980be12f13bfc625a",
    "description": "应用描述",
    "createdAt": "2024-05-01T00:00:00.000Z"
  }
}
```

#### PUT /apps/:id — 更新应用

**请求 Body**：`{ name?, description? }`（可选字段）

---

### 二、数据上报

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/report` | SDK 数据上报（支持批量、支持 sendBeacon text/plain 格式） |

**请求 Body**（数组格式）：

```json
[
  {
    "appKey": "your-app-key",
    "type": "performance | error | api | resource | custom",
    "data": {},
    "timestamp": 1713600000000,
    "pageUrl": "https://example.com/page",
    "userAgent": "Mozilla/5.0 ...",
    "userId": "user_123"
  }
]
```

**各 `type` 对应的 `data` 结构**：

| type | data 字段 | 说明 |
|------|-----------|------|
| `performance` | `dns, tcp, ttfb, domParse, loadTime, fcp, lcp` | 页面性能指标（ms） |
| `error` | `errorMessage, errorType, errorStack` | JS 异常信息 |
| `api` | `url, method, statusCode, duration, success` | API 请求记录 |
| `resource` | `resourceUrl, resourceType, errorMessage` | 资源加载异常 |
| `custom` | `eventName, eventType, ...extra` | 自定义事件 |

> **聚合上报**：当 `eventName` 为 `__batch__` 时，`data.events` 为事件数组，后端会自动拆解为独立记录存储。

**响应示例**：

```json
{
  "success": true,
  "data": {
    "received": 5,
    "performance": 1,
    "error": 2,
    "api": 1,
    "resource": 0,
    "custom": 1
  }
}
```

---

### 三、监控指标查询

#### 1. GET /metrics/overview — 今日指标概览

**Query 参数**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `appKey` | ✅ | 应用标识 |
| `date` | ❌ | 查询日期（`YYYY-MM-DD`），默认今天 |

**响应字段**：

| 字段 | 说明 |
|------|------|
| `errorCount` | 今日异常总数 |
| `errorPvRatio` | 异常 PV 比 |
| `affectedUsers` | 受影响用户数 |
| `affectedUserRatio` | 受影响用户占比 |
| `errorCountChange` | 异常数环比变化（%） |
| `affectedUsersChange` | 受影响用户数环比变化（%） |

---

#### 2. GET /metrics/trend — 异常时间趋势

**Query 参数**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `appKey` | ✅ | 应用标识 |
| `startTime` | ✅ | 开始时间（ISO 格式） |
| `endTime` | ✅ | 结束时间（ISO 格式） |
| `granularity` | ❌ | 粒度：`minute`（默认）/ `hour` / `day` |

**响应**：数组，每项含 `time`、`errorCount`、`errorPvRatio`、`affectedUserCount`

---

#### 3. GET /metrics/errors/top — JS 异常排行

**Query 参数**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `appKey` | ✅ | 应用标识 |
| `startTime` | ✅ | 开始时间 |
| `endTime` | ✅ | 结束时间 |
| `limit` | ❌ | 返回条数，默认 `200` |
| `groupBy` | ❌ | 分组：`errorMessage`（默认）/ `pageUrl` |

**响应**：数组，每项含：

| 字段 | 说明 |
|------|------|
| `content` | 异常内容 / 页面 URL |
| `count` | 异常次数 |
| `lastOccurrence` | 最近发生时间 |
| `changePercent` | 环比变化（%） |
| `trend` | 近 7 日趋势 `{ "2024-05-01": 5, "2024-05-02": 3, ... }` |

---

#### 4. GET /metrics/errors/logs — JS 异常日志详情

**Query 参数**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `appKey` | ✅ | 应用标识 |
| `errorMessage` | ✅ | 异常信息（精确匹配） |
| `startTime` | ✅ | 开始时间 |
| `endTime` | ✅ | 结束时间 |
| `page` | ❌ | 页码，默认 `1` |
| `pageSize` | ❌ | 每页条数，默认 `20` |

**响应**：

```json
{
  "total": 42,
  "page": 1,
  "pageSize": 20,
  "logs": [
    {
      "errorMessage": "Cannot read property ...",
      "errorType": "TypeError",
      "errorStack": "TypeError: Cannot read ...\n    at ...",
      "pageUrl": "https://example.com/page",
      "userId": "user_123",
      "userAgent": "Mozilla/5.0 ...",
      "createdAt": "2024-05-01T12:00:00.000Z"
    }
  ]
}
```

---

#### 5. GET /metrics/performance — 页面性能指标

**Query 参数**：`appKey`（✅）、`startTime`（✅）、`endTime`（✅）

**响应**：数组，按 `pageUrl` 分组，每项含：

| 字段 | 说明 |
|------|------|
| `pageUrl` | 页面 URL |
| `count` | 采样数 |
| `avgLoadTime` | 平均加载时间（ms） |
| `avgFcp` | 平均 FCP（ms） |
| `avgLcp` | 平均 LCP（ms） |
| `avgTtfb` | 平均 TTFB（ms） |
| `avgDns` | 平均 DNS 耗时（ms） |
| `avgTcp` | 平均 TCP 耗时（ms） |
| `avgDomParse` | 平均 DOM 解析耗时（ms） |
| `minLoadTime` | 最小加载时间（ms） |
| `maxLoadTime` | 最大加载时间（ms） |

---

#### 6. GET /metrics/api — API 请求监控

**Query 参数**：`appKey`（✅）、`startTime`（✅）、`endTime`（✅）

**响应**：数组，按 `url + method` 分组，每项含：

| 字段 | 说明 |
|------|------|
| `url` | API 地址 |
| `method` | 请求方法 |
| `totalCount` | 请求总次数 |
| `successCount` | 成功次数 |
| `successRate` | 成功率（%） |
| `avgDuration` | 平均耗时（ms） |
| `maxDuration` | 最大耗时（ms） |
| `slowRate` | 慢请求占比（%，>3000ms） |

---

#### 7. GET /metrics/resource — 资源异常监控

**Query 参数**：`appKey`（✅）、`startTime`（✅）、`endTime`（✅）

**响应**：数组，按 `resourceUrl + resourceType` 分组，每项含：

| 字段 | 说明 |
|------|------|
| `resourceUrl` | 资源地址 |
| `resourceType` | 资源类型（script / stylesheet / image / video / audio） |
| `count` | 异常次数 |
| `pageUrl` | 首个所在页面 |
| `affectedPages` | 影响页面数 |
| `lastOccurrence` | 最近发生时间 |

---

#### 8. GET /metrics/custom/top — 自定义事件排行

**Query 参数**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `appKey` | ✅ | 应用标识 |
| `startTime` | ✅ | 开始时间 |
| `endTime` | ✅ | 结束时间 |
| `eventType` | ❌ | 筛选事件类型：`custom` / `click` / `pageview` |

**响应**：数组，每项含：

| 字段 | 说明 |
|------|------|
| `eventName` | 事件名称 |
| `eventType` | 事件类型 |
| `count` | 触发次数 |
| `userCount` | 触发用户数（去空） |
| `lastOccurrence` | 最近触发时间 |

---

#### 9. GET /metrics/custom/logs — 自定义事件详情

**Query 参数**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `appKey` | ✅ | 应用标识 |
| `eventName` | ✅ | 事件名称 |
| `startTime` | ✅ | 开始时间 |
| `endTime` | ✅ | 结束时间 |
| `page` | ❌ | 页码，默认 `1` |
| `pageSize` | ❌ | 每页条数，默认 `20` |

**响应**：

```json
{
  "total": 15,
  "page": 1,
  "pageSize": 20,
  "logs": [
    {
      "eventName": "button_click",
      "eventType": "click",
      "extra": { "buttonId": "submit", "page": "login" },
      "pageUrl": "https://example.com/login",
      "userId": "user_123",
      "createdAt": "2024-05-01T12:00:00.000Z"
    }
  ]
}
```

---

### 四、告警规则

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/alerts` | 创建告警规则 |
| `GET` | `/alerts` | 告警规则列表 |
| `PUT` | `/alerts/:id` | 更新告警规则 |
| `DELETE` | `/alerts/:id` | 删除告警规则 |

#### POST /alerts — 创建告警规则

**请求 Body**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `appKey` | string | ✅ | 应用标识 |
| `name` | string | ✅ | 规则名称 |
| `metricType` | string | ✅ | 监控指标 |
| `operator` | string | ✅ | 触发条件运算符 |
| `threshold` | number | ✅ | 阈值 |
| `checkInterval` | number | ❌ | 检查周期（分钟），默认 5 |
| `enabled` | boolean | ❌ | 是否启用，默认 true |

**`metricType` 可选值**：

| 值 | 说明 |
|------|------|
| `error_count` | 异常次数 |
| `page_load_time` | 页面加载时间 |
| `api_duration` | API 耗时 |
| `api_success_rate` | API 成功率 |

**`operator` 可选值**：

| 值 | 说明 |
|------|------|
| `gt` | 大于 |
| `gte` | 大于等于 |
| `lt` | 小于 |
| `lte` | 小于等于 |
| `eq` | 等于 |

#### GET /alerts — 告警规则列表

**Query 参数**：`appKey`（✅）

---

## 数据模型（MongoDB Collections）

| Collection | 说明 | 关键字段 |
|------------|------|----------|
| `App` | 应用信息 | `name, appKey, description` |
| `PerformanceMetric` | 页面性能数据 | `appKey, pageUrl, dns, tcp, ttfb, fcp, lcp, loadTime` |
| `JsError` | JS 异常记录 | `appKey, errorMessage, errorType, errorStack, pageUrl, userId` |
| `ApiRequest` | API 请求记录 | `appKey, url, method, statusCode, duration, success` |
| `ResourceError` | 资源加载异常 | `appKey, resourceUrl, resourceType, errorMessage` |
| `CustomEvent` | 自定义事件 | `appKey, eventName, eventType, extra, pageUrl, userId` |
| `AlertRule` | 告警规则 | `appKey, name, metricType, operator, threshold, checkInterval, enabled` |

所有数据模型均包含 `createdAt` 和 `updatedAt` 时间戳（Mongoose `timestamps: true`）。

---

## 目录结构

```
egg-tracking/
├── app/
│   ├── controller/        # 控制器
│   │   ├── app.ts         # 应用管理（5 个接口）
│   │   ├── report.ts      # 数据上报（1 个接口）
│   │   ├── metrics.ts     # 指标查询（9 个接口）
│   │   └── alert.ts       # 告警规则（4 个接口）
│   ├── service/           # 业务逻辑
│   │   ├── app.ts
│   │   ├── report.ts
│   │   ├── metrics.ts
│   │   └── alert.ts
│   ├── model/             # 数据模型（7 个 Collection）
│   │   ├── app.ts
│   │   ├── performanceMetric.ts
│   │   ├── jsError.ts
│   │   ├── apiRequest.ts
│   │   ├── resourceError.ts
│   │   ├── customEvent.ts
│   │   └── alertRule.ts
│   ├── middleware/         # 中间件
│   │   ├── errorHandler.ts
│   │   └── requestLogger.ts
│   └── router.ts          # 路由定义（19 个接口）
├── config/                # 配置文件
├── typings/               # TypeScript 类型
├── app.ts                 # 应用入口
├── tsconfig.json
└── package.json
```
