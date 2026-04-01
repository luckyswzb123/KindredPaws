import '../scr/lib/polyfills.js';

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { handle } from 'hono/cloudflare-pages'
import authRoutes from '../scr/routes/auth.js'
import petsRoutes from '../scr/routes/pets.js'
import applicationsRoutes from '../scr/routes/applications.js'
import messagesRoutes from '../scr/routes/messages.js'
import profileRoutes from '../scr/routes/profile.js'
import favoritesRoutes from '../scr/routes/favorites.js'
import chatRoutes from '../scr/routes/chat.js'
import uploadRoutes from '../scr/routes/upload.js'
import adminRoutes from '../scr/routes/admin.js'

const app = new Hono()

app.use('*', logger())

app.use('/api/*', cors({
  origin: (origin) => origin,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
}))

app.use('*', async (c, next) => {
  if (!globalThis.process) {
    // @ts-ignore
    globalThis.process = { env: {} };
  }

  // @ts-ignore
  globalThis.process.env = { ...c.env, ...globalThis.process.env };
  await next();
})

app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: '萌爪家园后端 (Hono via Pages Functions) 运行正常',
    timestamp: new Date().toISOString(),
  })
})

app.route('/api/auth', authRoutes)
app.route('/api/pets', petsRoutes)
app.route('/api/applications', applicationsRoutes)
app.route('/api/messages', messagesRoutes)
app.route('/api/profile', profileRoutes)
app.route('/api/favorites', favoritesRoutes)
app.route('/api/chat', chatRoutes)
app.route('/api/admin/upload', uploadRoutes)
app.route('/api/admin', adminRoutes)

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

export const onRequest = handle(app)
