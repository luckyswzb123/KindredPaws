import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  console.log('[DEBUG] Received registration request for:', req.body.email);
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    console.log('[DEBUG] Registration missing fields');
    return res.status(400).json({ success: false, error: '邮箱、密码和昵称均为必填项' });
  }

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name } // Pass name to metadata so the trigger can use it
    });

    if (authError) {
      console.error('[DEBUG] Supabase createUser error:', authError.message);
      const msg = authError.message.includes('already registered')
        ? '该邮箱已被注册'
        : authError.message;
      return res.status(400).json({ success: false, error: msg });
    }

    const userId = authData.user.id;
    console.log('[DEBUG] Auth user created successfully:', userId);

    // Note: The public.user_profiles insert is handled automatically by the Supabase database trigger `on_auth_user_created`
    // We pass `name` in `user_metadata` above so the trigger sets the profile name.

    // Sign in to get session token
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) {
      return res.status(201).json({
        success: true,
        data: { user: { id: userId, email, name }, session: null },
        message: '注册成功，请登录',
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        user: { id: userId, email, name },
        session: {
          access_token: sessionData.session?.access_token,
          refresh_token: sessionData.session?.refresh_token,
          expires_in: sessionData.session?.expires_in,
        },
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: '邮箱和密码均为必填项' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ success: false, error: '邮箱或密码不正确' });
    }

    // Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return res.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: profile?.name || email,
          avatar_url: profile?.avatar_url,
          location: profile?.location,
        },
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_in: data.session?.expires_in,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    await supabaseAdmin.auth.admin.signOut(token);
  }
  return res.json({ success: true, message: '已成功退出登录' });
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ success: false, error: '缺少 refresh_token' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });
    if (error) {
      return res.status(401).json({ success: false, error: 'Token 刷新失败，请重新登录' });
    }
    return res.json({
      success: true,
      data: {
        access_token: data.session?.access_token,
        expires_in: data.session?.expires_in,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

export default router;
