FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖（含开发依赖，用于 tsc 编译）
RUN pnpm install --frozen-lockfile

# 复制源码
COPY . .

# 编译 TypeScript
RUN npm run build

# 移除开发依赖，仅保留生产依赖
RUN pnpm prune --prod

EXPOSE 7002

CMD ["npm", "start"]
