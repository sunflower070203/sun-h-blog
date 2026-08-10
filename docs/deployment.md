# Sunny Blog 部署与回滚

## 发布前检查

```bash
npm test
npm run typecheck
npm run build
docker compose config --quiet
```

不要提交 `.env`、数据库导出、`media_data`、上传图片或压缩备份。

## 服务器备份

进入项目目录后创建数据库备份，文件名使用当前时间：

```bash
mkdir -p /opt/backups/sunny-blog
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "/opt/backups/sunny-blog/postgres-$(date +%Y%m%d-%H%M%S).sql"
test -s "$(ls -t /opt/backups/sunny-blog/postgres-*.sql | head -n 1)"
```

`media_data` 是命名卷。更新应用时禁止执行 `docker compose down -v`。

## 更新

```bash
git pull --ff-only origin main
docker compose up -d --build
docker compose ps
```

API 启动时自动执行 `apps/api/drizzle` 中尚未应用的迁移。首次更新会创建 `site_settings` 表，不修改现有文章、管理员或媒体记录。

## 发布后检查

1. 首页、文章列表和一篇旧文章可以打开。
2. 管理员可以登录。
3. 文章搜索、状态筛选、复制和批量状态操作正常。
4. 后台壁纸可以保存并恢复默认。
5. Markdown 草稿可以预览和保存。
6. 多图片上传支持部分失败重试，图集发布后响应式显示。
7. `api`、`web`、`postgres` 容器均为 healthy/running。

域名和 HTTPS 尚未启用时保持 `COOKIE_SECURE=false`。HTTPS真正生效后再改为 `true` 并重新创建 API 容器。

## 回滚

记录更新前的 Git 提交：

```bash
git rev-parse HEAD
```

应用回滚使用已记录提交重新构建。只有在确认数据库数据被不兼容迁移修改时才恢复 PostgreSQL；本次 `site_settings` 迁移仅新增表，通常不需要恢复数据库。
