# Kindred Paws

Kindred Paws 是一个宠物领养与寄养平台，包含：

- 用户端 Web / App 前端
- 管理后台前端
- 基于 Cloudflare Pages Functions 的同站点 API

当前项目已经完成从旧 `kindredpaws-api` 独立后端到 `functions/` 的迁移，生产环境统一运行在 Cloudflare Pages。

## 当前架构

- 前台站点：`src/` + 根目录 Vite 构建
- 后台管理：`admin/` 独立 Vite + React 工程
- 后端接口：`functions/` 下的 Cloudflare Pages Functions
- API 入口：[functions/api/[[path]].js](/e:/Project/Kindred.Paws/functions/api/[[path]].js)
- 认证与管理员校验：
  - 普通登录：`/api/auth/login`
  - 管理接口：`/api/admin/*`
  - 管理员鉴权中间件：[functions/scr/middleware/auth.ts](/e:/Project/Kindred.Paws/functions/scr/middleware/auth.ts)

生产地址：

- 前台：`https://kindredpaws.pages.dev/`
- API：`https://kindredpaws.pages.dev/api`
- 健康检查：`https://kindredpaws.pages.dev/api/health`

## 目录结构

```text
Kindred.Paws/
├── src/                    # 用户端前端
├── admin/                  # 后台管理前端
├── functions/              # Cloudflare Pages Functions 后端
│   ├── api/[[path]].js     # Pages Functions 入口
│   └── scr/
│       ├── lib/            # Supabase / polyfills 等
│       ├── middleware/     # 认证中间件
│       └── routes/         # auth / admin / pets / profile 等路由
├── supabase/               # 数据库 schema 与初始化脚本
├── android/                # Capacitor Android 工程
├── dist/                   # 前台构建产物
└── capacitor.config.ts     # Capacitor 配置
```

## 技术栈

- 前端：React 19 + Vite + TypeScript
- 样式：Tailwind CSS 4
- 动效：Motion / Framer Motion
- 图标：Lucide React
- 后端：Hono + Cloudflare Pages Functions
- 数据库与认证：Supabase
- 对象存储：Cloudflare R2
- 移动端封装：Capacitor

## 环境变量

根目录 `.env` 需要至少包含：

```env
SUPABASE_URL=你的 Supabase 项目地址
SUPABASE_ANON_KEY=你的 Supabase Anon Key
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase Service Role Key

R2_S3_API_URL=你的 R2 S3 API 地址
R2_ACCESS_KEY_ID=你的 R2 Access Key ID
R2_SECRET_ACCESS_KEY=你的 R2 Secret Access Key
R2_BUCKET_NAME=你的 R2 Bucket 名称
R2_PUBLIC_DOMAIN=你的 R2 公网访问域名
```

说明：

- `functions/` 在本地和 Pages 上都会读取这些变量
- `admin` 开发环境默认通过 `/api` 代理访问本地 Functions
- 后台登录现在走你自己的 `/api/auth/login`，不再依赖浏览器直接连接 Supabase 登录

## 数据库初始化

在 Supabase SQL Editor 中执行：

- [schema.sql](/e:/Project/Kindred.Paws/supabase/schema.sql)

如果要授予第一个管理员账号权限，可执行：

```sql
update public.user_profiles
set is_admin = true
where email = 'YOUR_ADMIN_EMAIL';
```

## 本地开发

### 1. 安装依赖

```bash
npm install
cd admin
npm install
```

### 2. 启动用户端前端

项目根目录：

```bash
npm run dev
```

默认地址：

- `http://localhost:3000`

### 3. 启动后台管理前端

项目根目录：

```bash
npm run dev:admin
```

默认地址：

- `http://localhost:5173`

### 4. 启动本地 Functions API

项目根目录：

```bash
npm run build
npm run dev:functions
```

默认地址：

- `http://127.0.0.1:8788`

后台开发环境下会通过 Vite 代理自动转发：

- `http://localhost:5173/api` -> `http://127.0.0.1:8788/api`

### 5. 本地联调推荐组合

如果你要完整使用本地后台管理，请同时启动：

```bash
npm run dev:functions
npm run dev:admin
```

如果你要同时开发前台，也可以再开一个终端执行：

```bash
npm run dev
```

## 构建

前台构建：

```bash
npm run build
```

后台构建：

```bash
cd admin
npm run build
```

## Cloudflare Pages 部署

前台与 Functions 使用同一个 Pages 项目部署。

常用命令：

```bash
npm run build
npx wrangler pages deploy dist --project-name kindredpaws --branch main --commit-dirty=true
```

说明：

- `dist/` 是前台静态产物
- `functions/` 会被 Pages 自动识别并一起部署
- 项目不再依赖旧的 `workers.dev` 独立后端

## 后台登录与权限

当前后台登录链路：

- 登录页调用 `/api/auth/login`
- 登录成功后保存 `kp_access_token`
- 访问 `/api/admin/*` 时自动附带 Bearer Token
- 后端通过 `requireAdminAuth` 校验：
  - token 是否有效
  - `user_profiles.is_admin` 是否为 `true`

如果后台提示无权限，请先确认该账号在 Supabase 中已经被设为管理员。

## Android 打包

Capacitor 当前已调整为发布友好模式：

- Android 不再依赖局域网 `server.url`
- 原生端 API 使用线上 `https://kindredpaws.pages.dev/api`

同步 Android 工程：

```bash
npm run build
npx cap sync android
```

之后使用 Android Studio 打包 APK 或 AAB。

## 当前状态

- 旧 `kindredpaws-api` 目录已迁移并删除
- API 已统一到 `functions/`
- 后台用户管理已支持增删改查
- 宠物上下线接口已补齐
- 后台登录已改为走项目自身 `/api/auth/login`

## 开发建议

- 用户端改动优先在 `src/`
- 后台管理改动优先在 `admin/`
- 后端接口统一放在 `functions/scr/routes/`
- 发布前至少跑一次：
  - 根目录 `npm run build`
  - `admin` 目录 `npm run build`
