# 1Panel 部署说明

这个版本已经改成 `Node.js + PostgreSQL + 本地文件存储`，适合直接用 1Panel 的 Docker Compose 部署。

## 1. 准备环境变量

在服务器项目目录复制示例文件：

```bash
cp .env.1panel.example .env
```

至少修改这些值：

```env
APP_PORT=3000
POSTGRES_PASSWORD=换成强密码
BETTER_AUTH_SECRET=至少32位随机字符串
BETTER_AUTH_URL=https://www.linzesss.icu
ADMIN_EMAILS=admin@linzesss.icu
```

如果还没有绑定域名，可以临时用服务器 IP，例如：

```env
BETTER_AUTH_URL=http://服务器IP:3000
```

可以用下面命令生成密钥：

```bash
openssl rand -base64 32
```

## 2. 在 1Panel 部署

1. 打开 1Panel 的 `容器` 或 `应用商店 -> Docker Compose`。
2. 新建 Compose 项目，项目目录选择本仓库目录。
3. Compose 文件选择 `docker-compose.yml`。
4. 确认 `.env` 和 `docker-compose.yml` 在同一目录。
5. 点击启动。

启动时容器会自动执行：

```bash
node scripts/migrate-postgres.mjs
node server/serve.mjs
```

也就是说 PostgreSQL 表会自动创建，不需要手动导入 SQL。

## 3. 管理员账号

默认管理员邮箱是：

```text
admin@linzesss.icu
```

网站启动后，用这个邮箱在网站注册账号，系统会自动把它设为管理员。注册完成后可以从后台入口进入，或者直接访问：

```text
https://www.linzesss.icu/admin/screening
```

如果你想换管理员邮箱，只需要改 `.env` 里的 `ADMIN_EMAILS`，多个管理员邮箱用英文逗号分隔。已有账号的邮箱被加入 `ADMIN_EMAILS` 后，下次访问后台会自动同步成管理员。

## 4. 数据持久化

`docker-compose.yml` 已经配置两个 Docker volume：

```text
postgres-data  保存 PostgreSQL 数据
uploads        保存头像和群身份图片
```

不要删除这两个 volume，否则数据库和上传图片会丢失。

## 5. 反向代理

如果用域名访问，建议在 1Panel 网站里创建反向代理：

```text
127.0.0.1:3000
```

如果 1Panel 是分字段填写，使用：

```text
代理协议：http
代理地址：127.0.0.1
代理端口：3000
```

然后把 `.env` 里的 `BETTER_AUTH_URL` 改成实际公网地址。

你的正式站点地址建议保持为：

```env
BETTER_AUTH_URL=https://www.linzesss.icu
```

修改 `.env` 后需要重建或重启 Compose 项目。

## 6. 常用命令

```bash
docker compose up -d --build
docker compose logs -f app
docker compose restart app
docker compose down
```
