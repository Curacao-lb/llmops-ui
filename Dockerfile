# 第一阶段：构建 Vue 静态资源
FROM node:22-alpine AS builder

WORKDIR /app/web

# 与本机开发环境使用相同的 pnpm 版本，避免构建结果随最新版变化
RUN corepack enable && corepack install --global pnpm@10.16.1

# 先复制依赖清单，充分利用 Docker 构建缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Vite 在构建阶段读取这些变量；默认通过 Nginx 的 /api 代理访问后端
ARG VITE_API_PREFIX=/api
ARG VITE_TITLE
ARG VITE_ICP_CODE
ARG VITE_GA_CODE
ARG VITE_COS_DOMAIN

ENV VITE_API_PREFIX=$VITE_API_PREFIX
ENV VITE_TITLE=$VITE_TITLE
ENV VITE_ICP_CODE=$VITE_ICP_CODE
ENV VITE_GA_CODE=$VITE_GA_CODE
ENV VITE_COS_DOMAIN=$VITE_COS_DOMAIN

RUN pnpm build-only

# 第二阶段：使用 Nginx 托管构建产物
FROM nginx:alpine AS production

COPY --from=builder /app/web/dist /usr/share/nginx/html
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
