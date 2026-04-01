import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAdminAuth } from '../middleware/auth.js';

const router = new Hono();

router.use('*', requireAdminAuth);

const USER_COLUMNS = 'id, name, email, avatar_url, location, phone, is_admin, created_at, updated_at';

function normalizeUserPayload(body: any) {
  return {
    name: typeof body?.name === 'string' ? body.name.trim() : '',
    email: typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '',
    password: typeof body?.password === 'string' ? body.password : '',
    avatar_url: typeof body?.avatar_url === 'string' ? body.avatar_url.trim() : '',
    location: typeof body?.location === 'string' ? body.location.trim() : '',
    phone: typeof body?.phone === 'string' ? body.phone.trim() : '',
    is_admin: Boolean(body?.is_admin),
  };
}

async function fetchUserProfile(id: string) {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select(USER_COLUMNS)
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function listAllAuthUsers() {
  const perPage = 100;
  let page = 1;
  const allUsers: any[] = [];

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw error;
    }

    const users = data?.users || [];
    allUsers.push(...users);

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return allUsers;
}

async function buildAdminUsers() {
  const [authUsers, profileResult] = await Promise.all([
    listAllAuthUsers(),
    supabaseAdmin.from('user_profiles').select(USER_COLUMNS),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  const profiles = profileResult.data || [];
  const profileMap = new Map(profiles.map((profile: any) => [profile.id, profile]));
  const merged = authUsers.map((authUser: any) => {
    const profile = profileMap.get(authUser.id);
    const metadata = authUser.user_metadata || {};

    return {
      id: authUser.id,
      name: profile?.name || metadata.name || authUser.email || '',
      email: profile?.email || authUser.email || '',
      avatar_url: profile?.avatar_url || metadata.avatar_url || '',
      location: profile?.location || metadata.location || '',
      phone: profile?.phone || metadata.phone || '',
      is_admin: Boolean(profile?.is_admin),
      created_at: profile?.created_at || authUser.created_at || null,
      updated_at: profile?.updated_at || authUser.updated_at || null,
    };
  });

  const mergedIds = new Set(merged.map((user: any) => user.id));
  const profileOnlyUsers = profiles.filter((profile: any) => !mergedIds.has(profile.id));
  const users = [...merged, ...profileOnlyUsers];

  users.sort((a: any, b: any) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });

  return users;
}

router.get('/stats', async (c) => {
  try {
    const [users, { count: petsCount }, { count: pendingCount }, { count: approvedCount }] =
      await Promise.all([
        buildAdminUsers(),
        supabaseAdmin.from('pets').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'reviewing'),
        supabaseAdmin.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      ]);

    return c.json({
      success: true,
      data: {
        pets: petsCount || 0,
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        users: users.length,
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return c.json({ success: false, error: '获取统计数据失败' }, 500);
  }
});

router.get('/users', async (c) => {
  try {
    const data = await buildAdminUsers();
    return c.json({ success: true, data });
  } catch (err) {
    console.error('Admin users error:', err);
    return c.json({ success: false, error: '获取用户列表失败' }, 500);
  }
});

router.post('/users', async (c) => {
  const payload = normalizeUserPayload(await c.req.json());

  if (!payload.name || !payload.email || !payload.password) {
    return c.json({ success: false, error: '姓名、邮箱和初始密码不能为空' }, 400);
  }

  if (payload.password.length < 6) {
    return c.json({ success: false, error: '密码长度至少为 6 位' }, 400);
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        name: payload.name,
        avatar_url: payload.avatar_url,
        location: payload.location,
        phone: payload.phone,
      },
    });

    if (authError || !authData.user) {
      const message =
        authError?.message?.includes('already been registered') || authError?.message?.includes('already registered')
          ? '该邮箱已注册'
          : authError?.message || '创建用户失败';
      return c.json({ success: false, error: message }, 400);
    }

    const userId = authData.user.id;
    const now = new Date().toISOString();

    const { error: profileError } = await supabaseAdmin.from('user_profiles').upsert(
      {
        id: userId,
        name: payload.name,
        email: payload.email,
        avatar_url: payload.avatar_url,
        location: payload.location,
        phone: payload.phone,
        is_admin: payload.is_admin,
        updated_at: now,
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      throw profileError;
    }

    const data = await fetchUserProfile(userId);
    return c.json({ success: true, data }, 201);
  } catch (err) {
    console.error('Admin create user error:', err);
    return c.json({ success: false, error: '创建用户失败' }, 500);
  }
});

router.put('/users/:id', async (c) => {
  const id = c.req.param('id');
  const payload = normalizeUserPayload(await c.req.json());
  const currentUserId = c.get('userId');

  if (!payload.name || !payload.email) {
    return c.json({ success: false, error: '姓名和邮箱不能为空' }, 400);
  }

  if (currentUserId === id && payload.is_admin === false) {
    return c.json({ success: false, error: '不能取消当前登录管理员自己的权限' }, 400);
  }

  if (payload.password && payload.password.length < 6) {
    return c.json({ success: false, error: '密码长度至少为 6 位' }, 400);
  }

  try {
    const updateAuthPayload: Record<string, any> = {
      email: payload.email,
      user_metadata: {
        name: payload.name,
        avatar_url: payload.avatar_url,
        location: payload.location,
        phone: payload.phone,
      },
    };

    if (payload.password) {
      updateAuthPayload.password = payload.password;
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, updateAuthPayload);
    if (authError) {
      const message =
        authError.message?.includes('already been registered') || authError.message?.includes('already registered')
          ? '该邮箱已被其他账号使用'
          : authError.message;
      return c.json({ success: false, error: message || '更新认证信息失败' }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        name: payload.name,
        email: payload.email,
        avatar_url: payload.avatar_url,
        location: payload.location,
        phone: payload.phone,
        is_admin: payload.is_admin,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(USER_COLUMNS)
      .single();

    if (error) {
      throw error;
    }

    return c.json({ success: true, data });
  } catch (err) {
    console.error('Admin update user error:', err);
    return c.json({ success: false, error: '更新用户失败' }, 500);
  }
});

router.patch('/users/:id/admin', async (c) => {
  const id = c.req.param('id');
  const { is_admin } = await c.req.json();
  const currentUserId = c.get('userId');

  if (typeof is_admin !== 'boolean') {
    return c.json({ success: false, error: 'is_admin 必须为布尔值' }, 400);
  }

  if (currentUserId === id && is_admin === false) {
    return c.json({ success: false, error: '不能取消当前登录管理员自己的权限' }, 400);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        is_admin,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(USER_COLUMNS)
      .single();

    if (error) {
      throw error;
    }

    return c.json({ success: true, data });
  } catch (err) {
    console.error('Admin update user admin error:', err);
    return c.json({ success: false, error: '更新用户权限失败' }, 500);
  }
});

router.delete('/users/:id', async (c) => {
  const id = c.req.param('id');
  const currentUserId = c.get('userId');

  if (currentUserId === id) {
    return c.json({ success: false, error: '不能删除当前登录管理员自己' }, 400);
  }

  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) {
      throw error;
    }

    return c.json({ success: true, message: '用户已删除' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    return c.json({ success: false, error: '删除用户失败' }, 500);
  }
});

router.get('/pets', async (c) => {
  try {
    const { data, error } = await supabaseAdmin.from('pets').select('*').order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: '获取后台宠物列表失败' }, 500);
  }
});

router.post('/pets', async (c) => {
  const body = await c.req.json();
  const { name, breed, age, description, category, location, image_url, type, status, personality, healthStatus } =
    body;

  if (!name || !breed || !age || !category || !location || !image_url) {
    return c.json({ success: false, error: '必填字段缺失' }, 400);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('pets')
      .insert({
        name,
        breed,
        age,
        description,
        category,
        location,
        image_url,
        type: type || 'adoption',
        status: status || 'new',
        personality: personality || [],
        vaccination: healthStatus?.vaccination || false,
        neutered: healthStatus?.neutered || false,
        microchipped: healthStatus?.microchipped || false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return c.json({ success: true, data }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: `录入失败: ${err.message}` }, 500);
  }
});

router.put('/pets/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, breed, age, description, category, location, image_url, type, status, personality, healthStatus } =
    body;

  try {
    const { data, error } = await supabaseAdmin
      .from('pets')
      .update({
        name,
        breed,
        age,
        description,
        category,
        location,
        image_url,
        type,
        status,
        personality,
        vaccination: healthStatus?.vaccination,
        neutered: healthStatus?.neutered,
        microchipped: healthStatus?.microchipped,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: '更新失败' }, 500);
  }
});

router.patch('/pets/:id/status', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();

  if (!['new', 'urgent', 'none'].includes(status)) {
    return c.json({ success: false, error: '无效的宠物状态' }, 400);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('pets')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return c.json({ success: true, data });
  } catch (err) {
    console.error('Admin update pet status error:', err);
    return c.json({ success: false, error: '更新宠物上下线状态失败' }, 500);
  }
});

router.delete('/pets/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const { error } = await supabaseAdmin.from('pets').delete().eq('id', id);
    if (error) {
      throw error;
    }

    return c.json({ success: true, message: '宠物已成功从库中移除' });
  } catch (err) {
    return c.json({ success: false, error: '删除失败' }, 500);
  }
});

router.get('/applications', async (c) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select(
        `
        *,
        pets (name, breed, image_url),
        user_profiles (name, avatar_url)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: '获取申请列表失败' }, 500);
  }
});

router.patch('/applications/:id/status', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();

  if (!['approved', 'rejected'].includes(status)) {
    return c.json({ success: false, error: '无效的状态' }, 400);
  }

  try {
    const { data: app, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*, pets(id, name)')
      .eq('id', id)
      .single();

    if (appError || !app) {
      return c.json({ success: false, error: '申请不存在' }, 404);
    }

    const { error: updateError } = await supabaseAdmin.from('applications').update({ status }).eq('id', id);

    if (updateError) {
      throw updateError;
    }

    const pet = Array.isArray(app.pets) ? app.pets[0] : app.pets;

    if (status === 'approved' && pet?.id) {
      await supabaseAdmin
        .from('pets')
        .update({
          status: 'none',
          description: `[已领养] ${pet.name} 已经找到了家。`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pet.id);

      await supabaseAdmin.from('messages').insert({
        user_id: app.applicant_id,
        sender: '系统管理员',
        subject: '领养申请已通过',
        preview: `您对 ${pet.name} 的申请已获批准。`,
        content: `恭喜，您对宠物 ${pet.name} 的申请已经通过审核，我们的工作人员会尽快联系您。`,
        icon: 'bell',
        type: 'adoption',
        is_read: false,
      });
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('Admin update application status error:', err);
    return c.json({ success: false, error: '审批操作失败' }, 500);
  }
});

export default router;
