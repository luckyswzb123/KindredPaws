import { supabaseAdmin } from '../lib/supabase.js';

/**
 * 💡 Hono 版用户认证中间件
 */
export const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: '未提供认证令牌' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return c.json({ success: false, error: '认证令牌无效或已过期' }, 401);
    }

    // 在 Hono 中，我们使用 c.set 来传递变量
    c.set('userId', user.id);
    c.set('userEmail', user.email);

    await next();
  } catch (err) {
    return c.json({ success: false, error: '认证失败' }, 401);
  }
}

/**
 * 💡 Hono 版管理员认证中间件
 */
export const requireAdminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: '未提供认证令牌' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. 验证基础身份
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return c.json({ success: false, error: '认证令牌无效或已过期' }, 401);
    }

    // 2. 检查数据库中的管理员权限
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      console.warn(`[Security] Unauthorized admin access attempt by ${user.email}`);
      return c.json({ success: false, error: '权限不足，仅管理员可访问' }, 403);
    }

    c.set('userId', user.id);
    c.set('userEmail', user.email);
    c.set('isAdmin', true);

    await next();
  } catch (err) {
    console.error('Admin Auth Error:', err);
    return c.json({ success: false, error: '鉴权流程异常' }, 401);
  }
}
