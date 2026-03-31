import express from 'express';
import cors from 'cors';
// 1. 导入适配器（刚才你刚安装的）
import serverlessExpress from '@codegenie/serverless-express';

// 导入路由（保持你的 scr/ 路径和 .js 后缀）
import authRoutes from './scr/routes/auth.js';
import petsRoutes from './scr/routes/pets.js';
import applicationsRoutes from './scr/routes/applications.js';
import messagesRoutes from './scr/routes/messages.js';
import profileRoutes from './scr/routes/profile.js';
import favoritesRoutes from './scr/routes/favorites.js';
import chatRoutes from './scr/routes/chat.js';
import uploadRoutes from './scr/routes/upload.js';
import adminRoutes from './scr/routes/admin.js';

const app = express();

// Middleware
// 2. 这里的 CORS 建议加上前端域名限制，防止被盗刷
app.use(cors());
app.use(express.json({ limit: '10mb' }));
//app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: '萌爪家园后端服务在 Cloudflare 上运行正常', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', uploadRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: '接口不存在' });
});

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

// 3. 【核心修改】删除原来的 app.listen，改为导出 fetch 处理器
export default {
  async fetch(request: Request, env: any, ctx: any) {
    // 将 Cloudflare 的环境变量 env 注入到 process.env 中，方便你的路由代码调用
    globalThis.process = globalThis.process || {};
    globalThis.process.env = { ...globalThis.process.env, ...env };

    return serverlessExpress({ app })(request, env, ctx);
  }
};

