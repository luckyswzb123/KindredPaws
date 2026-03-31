import '../scr/lib/polyfills.js'; // 🚀 极速补丁：必须放在最前，以在模块加载阶段提供 process 对象

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { handle } from 'hono/cloudflare-pages' // Pages 专用适配器

// --- 2. 导入路由 (请确保 scr 文件夹在 functions 目录下) ---
import authRoutes from '../scr/routes/auth.js'
import petsRoutes from '../scr/routes/pets.js'

// 🚨 暂时注释掉下面这些，直到内部改为 Hono 格式
// import applicationsRoutes from '../scr/routes/applications.js'
// import messagesRoutes from '../scr/routes/messages.js'
// import profileRoutes from '../scr/routes/profile.js'
// import favoritesRoutes from '../scr/routes/favorites.js'
// import chatRoutes from '../scr/routes/chat.js'
// import uploadRoutes from '../scr/routes/upload.js'
// import adminRoutes from '../scr/routes/admin.js'

const app = new Hono()

// --- 中间件 ---
app.use('*', logger())

/**
 * CORS 配置
 */
app.use('/api/*', cors({
    origin: (origin) => origin,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
}))

// --- 环境变量同步中间件 ---
app.use('*', async (c, next) => {
    // 动态同步 Cloudflare 的 c.env 到 process.env，兼容旧路由逻辑
    // @ts-ignore
    globalThis.process.env = { ...c.env, ...globalThis.process.env };
    await next();
})

// --- 健康检查 ---
app.get('/api/health', (c) => {
    return c.json({
        success: true,
        message: '萌爪家园后端 (Pages Functions - Subdomain) 运行正常',
        timestamp: new Date().toISOString(),
        env_status: typeof process !== 'undefined' ? 'active' : 'missing'
    })
})

// --- 3. 挂载路由 ---
app.route('/api/auth', authRoutes)
app.route('/api/pets', petsRoutes)

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

/**
 * 4. 导出给 Pages 使用
 */
export const onRequest = handle(app)
