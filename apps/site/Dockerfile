FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/site/package.json apps/site/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web/src apps/web/src
COPY apps/web/public apps/web/public
COPY apps/site/astro.config.mjs apps/site/astro.config.mjs
COPY apps/site/src apps/site/src
COPY apps/site/scripts apps/site/scripts
RUN npm run build -w @sunny/shared
WORKDIR /app/apps/site
ENV ASTRO_TELEMETRY_DISABLED=1
CMD ["node", "scripts/sync.mjs"]
