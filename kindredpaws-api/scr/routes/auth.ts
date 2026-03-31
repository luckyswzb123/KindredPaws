import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase.js';

const router = new Hono();

// POST /api/auth/register
router.post('/register', async (c) => {
  const body = await c.req.json();
  const { email, password, name } = body;

  console.log('[DEBUG] Received registration request for:', email);

  if (!email || !password || !name) {
    console.log('[DEBUG] Registration missing fields');
    return c.json({ success: false, error: '邮箱、密码和昵称均为必填项' }, 400);
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      console.error('[DEBUG] Supabase createUser error:', authError.message);
      const msg = authError.message.includes('already registered')
        ? '该邮箱已被注册'
        : authError.message;
      return c.json({ success: false, error: msg }, 400);
    }

    const userId = authData.user.id;
    console.log('[DEBUG] Auth user created successfully:', userId);

    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) {
      return c.json({
        success: true,
        data: { user: { id: userId, email, name }, session: null },
        message: '注册成功，请登录',
      }, 201);
    }

    return c.json({
      success: true,
      data: {
        user: { id: userId, email, name },
        session: {
          access_token: sessionData.session?.access_token,
          refresh_token: sessionData.session?.refresh_token,
          expires_in: sessionData.session?.expires_in,
        },
      },
    }, 201);
  } catch (err) {
    console.error('Register error:', err);
    return c.json({ success: false, error: '服务器内部错误' }, 500);
  }
});

// POST /api/auth/login
router.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ success: false, error: '邮箱和密码均为必填项' }, 400);
  }

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (error) {
      return c.json({ success: false, error: '邮箱或密码不正确' }, 401);
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return c.json({
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
    return c.json({ success: false, error: '服务器内部错误' }, 500);
  }
});

// POST /api/auth/logout
router.post('/logout', async (c) => {
  const authHeader = c.req.header('authorization');
  const token = authHeader?.split(' ')[1];
  if (token) {
    await supabaseAdmin.auth.admin.signOut(token);
  }
  return c.json({ success: true, message: '已成功退出登录' });
});

// POST /api/auth/refresh
router.post('/refresh', async (c) => {
  const body = await c.req.json();
  const { refresh_token } = body;

  if (!refresh_token) {
    return c.json({ success: false, error: '缺少 refresh_token' }, 400);
  }

  try {
    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });
    if (error) {
      return c.json({ success: false, error: 'Token 刷新失败，请重新登录' }, 401);
    }
    return c.json({
      success: true,
      data: {
        access_token: data.session?.access_token,
        expires_in: data.session?.expires_in,
      },
    });
  } catch (err) {
    return c.json({ success: false, error: '服务器内部错误' }, 500);
  }
});

export default router;
