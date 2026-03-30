import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  isAdmin?: boolean;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, error: '认证令牌无效或已过期' });
    }

    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: '认证失败' });
  }
}

export async function requireAdminAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Verify basic auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, error: '认证令牌无效或已过期' });
    }

    // 2. Check for admin role in user_profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      console.warn(`[Security] Unauthorized admin access attempt by ${user.email}`);
      return res.status(403).json({ success: false, error: '权限不足，仅管理员可访问' });
    }

    req.userId = user.id;
    req.userEmail = user.email;
    req.isAdmin = true;
    next();
  } catch (err) {
    console.error('Admin Auth Error:', err);
    return res.status(401).json({ success: false, error: '鉴权流程异常' });
  }
}
