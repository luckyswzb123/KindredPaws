# 萌爪家园 (Kindred Paws) - 宠物领养全栈平台

![Kindred Paws Banner](https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=1200&q=80)

**萌爪家园** 是一个致力于流浪动物领养与救助的现代化全栈平台。该项目包含面向普通用户的 **移动端 Web App** 和面向管理员的 **PC 端后台管理系统**。

## 🌟 项目亮点

-   **双端隔离架构**：独立的 C 端（用户）与 B 端（管理）工程，共享同一套 API 逻辑。
-   **现代设计语言**：遵循一致的视觉规范，包含毛玻璃效果（Glassmorphism）、微交互动效和响应式布局。
-   **云存储集成**：深度接入 **Cloudflare R2** 解决宠物高清大图存储需求。
-   **实时鉴权系统**：基于 **Supabase Auth** 实现双端统一认证与管理员权限隔离。

---

## 🛠️ 技术栈

| 模块  | 技术选型 |
| :--- | :--- |
| **前端框架** | React 19 + Vite 6 + TypeScript |
| **样式方案** | Tailwind CSS 4.0 + Motion (framer-motion) |
| **图标/UI** | Lucide React |
| **状态/认证** | Supabase Auth |
| **后端服务** | Node.js + Express + TSX (Runtime) |
| **数据库** | Supabase (PostgreSQL) |
| **对象存储** | Cloudflare R2 (S3 兼容协议) |

---

## 📂 项目结构

```text
Kindred.Paws/
├── src/                # [C端] 移动端移动端 Web App (React)
├── admin/              # [B端] PC端后台管理系统 (React)
├── server/             # [后端] Express API 路由与业务逻辑
│   ├── routes/         # API 路由逻辑 (auth, admin, upload, pets 等)
│   ├── middleware/     # 核心中间件 (鉴权, 文件处理)
│   ├── lib/            # 第三方服务初始化 (Supabase, R2)
├── supabase/           # 数据库定义
│   └── schema.sql      # 完整的表结构、触发器与 RLS 策略
└── .env                # 环境变量配置文件
```

---

## 🚀 快速开始

### 1. 克隆并安装依赖
```bash
git clone <repository-url>
cd Kindred.Paws
npm install
cd admin && npm install
```

### 2. 配置环境变量
在根目录创建 `.env` 文件，并填入以下内容：
```env
# Supabase
SUPABASE_URL=你的项目URL
SUPABASE_ANON_KEY=你的Anon密钥
SUPABASE_SERVICE_ROLE_KEY=你的ServiceRole密钥

# Cloudflare R2
R2_S3_API_URL=你的R2公网端点
R2_ACCESS_KEY_ID=你的AccessID
R2_SECRET_ACCESS_KEY=你的SecretKey
R2_BUCKET_NAME=你的Bucket名
R2_PUBLIC_DOMAIN=你的R2加速域名

# Servers
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 3. 初始化数据库
1.  登录 [Supabase 控制台](https://supabase.com)。
2.  进入 **SQL Editor**，执行 `supabase/schema.sql` 中的所有脚本。
3.  **开启管理员权限**（可选）：
    ```sql
    UPDATE user_profiles SET is_admin = TRUE WHERE email = 'YOUR_ADMIN_EMAIL';
    ```

### 4. 运行项目
在项目根目录执行：
```bash
npm run dev:all
```
这会同时启动以下三个服务：
-   **用户端 App**: [http://localhost:3000](http://localhost:3000)
-   **后台管理系统**: [http://localhost:5173](http://localhost:5173) (视 Vite 端口而定)
-   **后端服务 API**: [http://localhost:3001](http://localhost:3001)

---

## 🛡️ 鉴权机制

-   **双重校验**：不仅在前端通过 `ProtectedRoute` 拦截 unauthorized 访问，后端针对 `/api/admin/*` 路径强制使用 `requireAdminAuth` 中间件，二次校验数据库 `user_profiles` 表中的 `is_admin` 标记。
-   **JWT 验证**：无状态认证，Session 由 Supabase 托管。

---

## 📝 开发规范
-   **完全解耦**：管理后台代码放置于 `/admin`，不要修改 `src/` 下的代码，以免影响移动端。
-   **组件复用**：通用排版、配色逻辑优先复用根目录的 Tailwind 配置。

---

## 🤝 贡献与支持
如果你发现 Bug 或有改进建议，欢迎提交 Issue。

**Kindred Paws - 让每一份爱都有归宿。**
