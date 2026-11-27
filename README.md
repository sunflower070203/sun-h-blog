# Sunny 全栈个人博客

一个只供 Sunny 管理内容的个人博客。访客只能阅读公开文章；没有注册、评论、点赞和多用户系统。

## 功能

- 帆船主题的响应式个人主页
- 公开文章列表、关键词搜索和文章详情
- `/admin` 单管理员后台
- 富文本编辑、草稿、发布、撤回发布和删除
- 封面图片上传、分类、标签、置顶
- 浏览器本地自动保存，避免意外丢稿
- PostgreSQL 持久化
- Docker 命名卷中的本地图片存储
- Docker Compose 一键部署
- 科研索引式首页与响应式文章图集
- 后台文章搜索、筛选、分页、复制和批量发布/撤回
- 富文本与 Markdown 双模式写作
- 多图片拖放上传、逐张插入或生成图集
- 仅管理员可见的自定义后台壁纸

Markdown 模式支持标题、段落、粗体、斜体、链接、图片、引用、列表和围栏代码块。图集等富文本专属结构会阻止无提示的有损切换，并提示回到富文本模式处理。

## 目录

```text
apps/site       Astro 访客页面与静态发布
apps/web        React + Vite 管理后台及共用页面样式
apps/api        Fastify API、认证、数据库和图片上传
packages/shared 前后端共享类型与验证
deploy          Nginx 配置
```

## 本地开发

要求 Node.js 22.19 或更新的 22 LTS 版本，以及 Docker Desktop。

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

- 管理后台开发地址为 `http://localhost:5173/admin`
- API 默认地址为 `http://localhost:3001`

运行 `npm run dev -w @sunny/site` 可预览 Astro 页面。默认使用空内容，设置 `SUNNY_SITE_SNAPSHOT` 为本地公开内容快照路径可预览实际资料。`npm test` 会从测试资料构建静态站点，并检查中文文章地址、富文本、图集和草稿隔离。

首次创建管理员：

```bash
npm run admin:create
```

该命令读取 `.env` 中的 `ADMIN_EMAIL` 与 `ADMIN_PASSWORD`。以后再次执行会重置同一邮箱的密码。

## 使用 Docker 启动完整网站

1. 复制 `.env.example` 为 `.env`。
2. 修改所有 `replace-with-...` 配置。
3. 启动：

```bash
docker compose up -d --build
```

4. 创建管理员：

```bash
docker compose exec api npm run admin:create -w @sunny/api
```

5. 浏览器打开服务器的 `8080` 端口；管理入口为 `/admin`。

## 云服务器部署

### 1. 准备服务器

- 当前部署已适配腾讯云 OpenCloudOS 9；其他能运行 Docker Engine 与 Compose Plugin 的 Linux 发行版也可使用。
- 当前博客使用 `8080`，安全组需开放 `22` 和 `8080`。域名接入后，再按反向代理方案开放 `80`、`443`。
- 安装 Docker Engine 与 Docker Compose Plugin。

图片保存在 Docker 命名卷 `media_data`，无需对象存储密钥。不要把 `.env` 上传到 GitHub，也不要执行 `docker compose down -v`。

### 2. 上传并启动

```bash
git clone <你的仓库地址> sunny-blog
cd sunny-blog
cp .env.example .env
nano .env
docker compose up -d --build
docker compose exec api npm run admin:create -w @sunny/api
```

### 3. 域名与 HTTPS

将域名 A 记录指向服务器公网 IP。完成备案后，在宿主机增加按域名匹配的 Nginx/Caddy 反向代理，将 HTTPS 请求转发到本项目的 `8080` 端口。HTTPS 真正启用后，将 `.env` 中的 `COOKIE_SECURE` 改为 `true` 并重新创建 API 容器。

### 4. 更新

```bash
git pull
docker compose up -d --build
```

数据库迁移会在 API 容器启动时自动运行。更新已有安装时沿用原来的 Compose 项目名，以便继续使用原 PostgreSQL 和媒体卷。

`public-site` 从现有公开 API 读取已发布文章、公开资料和外观设置，内容有变化时重新生成 HTML。Nginx 在新一版完整生成后切换目录。文章撤回后，详情校验立即停止提供正文，首页与归档会在下一次生成后更新。生成目录可重建，备份仍以 PostgreSQL 和媒体卷为准。

## 备份

数据库：

```bash
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > sunny-blog-backup.sql
```

图片位于 `media_data` 命名卷，应与数据库一起定期备份。文章删除不会自动删除图片，避免仍被其他文章引用的图片失效。

## 上传 GitHub

```bash
git init
git add .
git commit -m "Initial Sunny blog"
git branch -M main
git remote add origin <你的 GitHub 仓库地址>
git push -u origin main
```

`.gitignore` 已排除 `.env`、依赖、构建产物和本地数据。

## 修改个人信息

编辑：

```text
apps/web/src/content/site.ts
```

帆船图片位于：

```text
apps/web/public/sailboat.png
```

页面颜色和公开网站布局位于 `apps/web/src/styles.css`，管理后台样式位于 `apps/web/src/admin/admin.css`。

## 安全提醒

- 管理员密码至少 12 位，`SESSION_SECRET` 至少 32 个随机字符。
- 不要提交 `.env`。
- 定期更新依赖、备份 PostgreSQL 和 `media_data`。
- 公开部署前务必配置 HTTPS。
