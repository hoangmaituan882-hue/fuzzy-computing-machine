# Galgame Screening

面向三个舰长群的 Galgame 竞猜与放映记录应用。项目由 FlareStarter SaaS 模板演进而来，当前正式运行栈是 **TanStack Start + Node.js + PostgreSQL**。

[English](README.en.md)

## 当前能力

- 匿名参与者选择群身份，按群提名 Galgame、投票和撤票。
- 通过 Bangumi API 搜索高分游戏并带入封面与简介。
- 登录、邮箱验证、找回密码、Google/GitHub OAuth 和管理员角色。
- 已登录用户查看放映统计、历史记录并提交评分与评论。
- 管理员管理用户、群身份卡、候补名单、赞助和反馈。
- Stripe 订阅、Resend 邮件、站内文档、SEO 与中英文路由等模板能力仍保留。

## 技术栈

- React 19、TanStack Start/Router、TypeScript 6、Vite 8
- PostgreSQL 16、Drizzle ORM、postgres.js
- Better Auth、Stripe、Resend
- Tailwind CSS 4、Radix/shadcn、Lucide、GSAP、Framer Motion
- Node.js 22、Docker Compose、1Panel

## 本地启动

要求 Node.js 22+、pnpm 10+ 和 Docker。

```bash
pnpm install
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
pnpm db:migrate
pnpm dev
```

打开 <http://localhost:3004>。

`.env` 中至少需要：

```env
DATABASE_URL=postgres://galgame:galgame_password@localhost:5432/galgame
BETTER_AUTH_SECRET=至少32位随机字符串
BETTER_AUTH_URL=http://localhost:3004
```

`RESEND_*`、OAuth、Stripe、Turnstile 和分析配置均可留空；未配置的集成会关闭或使用开发降级路径。完整说明见 [环境变量](src/content/docs/getting-started/environment.mdx)。

## 常用命令

```bash
pnpm dev                 # 开发服务器，端口 3004
pnpm build               # 生产构建
pnpm start               # 运行 dist/server/server.js
pnpm lint                # ESLint
pnpm typecheck           # 生成文档类型并运行 tsc
pnpm test:node           # 当前可用的 Node 单元测试
pnpm test                # 全量测试，包含待迁移的旧 Workers/D1 套件
pnpm db:generate         # 根据 pg-core schema 生成 PostgreSQL SQL
pnpm db:migrate          # 按文件顺序应用未执行的 PostgreSQL 迁移
```

## 目录

```text
src/
  features/screening/    # 群身份、提名、投票、放映、评价与统计
  features/auth/         # Better Auth
  features/billing/      # Stripe 与权益
  features/storage/      # 本地持久化文件存储
  routes/                # TanStack 文件路由与 API
  db/                    # PostgreSQL Drizzle 客户端和 schema barrel
  content/docs/          # Fumadocs 站内文档
drizzle/postgres/        # 顺序执行的 PostgreSQL 迁移
server/serve.mjs         # Node HTTP 适配器
```

## 部署

生产环境使用 Docker Compose：

```bash
cp .env.1panel.example .env
# 修改数据库密码、BETTER_AUTH_SECRET、BETTER_AUTH_URL、ADMIN_EMAILS
docker compose up -d --build
```

容器启动时会先运行迁移，再启动 Node 服务。数据库与上传文件分别保存在 `postgres-data`、`uploads` volume。完整步骤见 [DEPLOY_1PANEL.md](DEPLOY_1PANEL.md)。

## 当前迁移状态

仓库仍保留上游 Cloudflare Worker、Wrangler 和 Workers/D1 测试文件，便于迁移期间对照，但它们不是当前生产入口。

- `pnpm lint`、`pnpm typecheck` 和 `pnpm test:node` 应通过。
- Workers/D1 集成测试尚未迁移到隔离 PostgreSQL 测试库，`pnpm test` 当前不会全绿。
- 竞猜身份已改为服务端 HttpOnly Cookie，且公开数据不再返回参与者 ID；但匿名模式仍不能从根本上防止用户主动清 Cookie 后重复参与，后续需增加登录或更强的活动级防滥用策略。
- 提名和投票的唯一约束仍是全局级，尚待引入明确的 campaign/round 模型和管理员开关场流程。

不要继续按照旧 Cloudflare 文档新增 D1/R2 代码。当前架构与开发约定以 [AGENTS.md](AGENTS.md) 为准。

## License

[Apache License 2.0](LICENSE)
