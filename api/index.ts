import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import petsRoutes from './routes/pets.js';
import applicationsRoutes from './routes/applications.js';
import messagesRoutes from './routes/messages.js';
import profileRoutes from './routes/profile.js';
import favoritesRoutes from './routes/favorites.js';
import chatRoutes from './routes/chat.js';
import uploadRoutes from './routes/upload.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: '萌爪家园后端服务运行正常', timestamp: new Date().toISOString() });
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
app.use('/api/admin', uploadRoutes); // Use admin prefix for uploads too

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: '接口不存在' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    const address = `http://192.168.2.6:${PORT}`;
    console.log(`
🐾 萌爪家园后端服务已启动`);
    console.log(`   本地地址: http://localhost:${PORT}`);
    console.log(`   外部地址: ${address}`);
    console.log(`   健康检查: ${address}/api/health\n`);
  });
}

export default app;
