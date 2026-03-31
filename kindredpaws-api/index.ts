import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { handle } from 'hono/cloudflare-pages' // 🚨 关键：引入 Pages 适配器

// --- 1. 导入路由 (请确保 scr 文件夹也在 functions 目录下) ---
import authRoutes from './scr/routes/auth.js'
import petsRoutes from './scr/routes/pets.js'

// 🚨 暂时注释掉下面这些，直到内部改为 Hono 格式
// import applicationsRoutes from './scr/routes/applications.js'
// import messagesRoutes from './scr/routes/messages.js'
// import profileRoutes from './scr/routes/profile.js'
// import favoritesRoutes from './scr/routes/favorites.js'
// import chatRoutes from './scr/routes/chat.js'
// import uploadRoutes from './scr/routes/upload.js'
// import adminRoutes from './scr/routes/admin.js'

const app = new Hono()

// --- 中间件 ---
app.use('*', logger())

/**
 * 优化后的 CORS 配置
 * 注意：在 Pages 同源模式下，其实不需要 CORS，但保留以防万一
 */
app.use('/api/*', cors({
  origin: (origin) => origin,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
}))

// --- 环境变量兼容处理 ---
app.use('*', async (c, next) => {
  if (!globalThis.process) {
    globalThis.process = { env: {} };
  }
  globalThis.process.env = { ...c.env, ...globalThis.process.env };
  await next();
})

// --- 健康检查 (现在访问路径是: /api/health) ---
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: '萌爪家园后端 (Hono via Pages Functions) 运行正常',
    timestamp: new Date().toISOString()
  })
})

// --- 2. 挂载路由 ---
app.route('/api/auth', authRoutes)
app.route('/api/pets', petsRoutes)

// 保持关闭部分
// app.route('/api/applications', applicationsRoutes)
// app.route('/api/messages', messagesRoutes)
// app.route('/api/profile', profileRoutes)
// app.route('/api/favorites', favoritesRoutes)
// app.route('/api/chat', chatRoutes)
// app.route('/api/admin/upload', uploadRoutes)
// app.route('/api/admin', adminRoutes)

// --- 错误处理 ---
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({
    success: false,
    error: '服务器内部错误',
    message: err.message
  }, 500)
})

app.notFound((c) => {
  return c.json({ success: false, error: '接口不存在' }, 404)
})

// 🚨 关键修改：导出 handle 以供 Cloudflare Pages 使用
export const onRequest = handle(app)
