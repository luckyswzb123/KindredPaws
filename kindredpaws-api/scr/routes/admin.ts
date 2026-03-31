import { Hono } from 'hono';
import { supabaseAdmin } from '../../lib/supabase.js';

const router = new Hono();

/**
 * --- 管理员权限中间件 ---
 * 逻辑：校验 Token 并检查用户是否具有管理员权限
 */
const requireAdminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: '未授权访问' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return c.json({ success: false, error: '登录已过期' }, 401);
  }

  // 检查是否为管理员 (假设你在 user_metadata 或单独的表中定义了角色)
  // 这里保留你原有的管理员判定逻辑，通常是检查特定的 email 或 metadata
  const isAdmin = user.app_metadata?.role === 'admin' || user.email === 'admin@kindredpaws.com';

  if (!isAdmin) {
    return c.json({ success: false, error: '权限不足' }, 403);
  }

  c.set('userId', user.id);
  await next();
};

// 所有 admin 路由均应用权限校验
router.use('*', requireAdminAuth);

// GET /api/admin/stats - 仪表盘统计
router.get('/stats', async (c) => {
  try {
    const [{ count: petsCount }, { count: pendingCount }, { count: approvedCount }, { count: usersCount }] = await Promise.all([
      supabaseAdmin.from('pets').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'reviewing'),
      supabaseAdmin.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true })
    ]);

    return c.json({
      success: true,
      data: {
        pets: petsCount || 0,
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        users: usersCount || 0
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return c.json({ success: false, error: '获取统计数据失败' }, 500);
  }
});

// GET /api/admin/pets - 后台宠物列表
router.get('/pets', async (c) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: '获取后台宠物列表失败' }, 500);
  }
});

// POST /api/admin/pets - 新增宠物
router.post('/pets', async (c) => {
  const body = await c.req.json();
  const { name, breed, age, description, category, location, image_url, type, status, personality, healthStatus } = body;

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

    if (error) throw error;
    return c.json({ success: true, data }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: `录入失败: ${err.message}` }, 500);
  }
});

// PUT /api/admin/pets/:id - 更新宠物
router.put('/pets/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, breed, age, description, category, location, image_url, type, status, personality, healthStatus } = body;

  try {
    const { data, error } = await supabaseAdmin
      .from('pets')
      .update({
        name, breed, age, description, category, location, image_url, type, status, personality,
        vaccination: healthStatus?.vaccination,
        neutered: healthStatus?.neutered,
        microchipped: healthStatus?.microchipped,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: '更新失败' }, 500);
  }
});

// DELETE /api/admin/pets/:id - 删除宠物
router.delete('/pets/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const { error } = await supabaseAdmin.from('pets').delete().eq('id', id);
    if (error) throw error;
    return c.json({ success: true, message: '宠物已成功从库中移除' });
  } catch (err) {
    return c.json({ success: false, error: '删除失败' }, 500);
  }
});

// GET /api/admin/applications - 申请列表
router.get('/applications', async (c) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        pets (name, breed, image_url),
        user_profiles (name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: '获取申请列表失败' }, 500);
  }
});

// PATCH /api/admin/applications/:id/status - 审批申请
router.patch('/applications/:id/status', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();

  if (!['approved', 'rejected'].includes(status)) {
    return c.json({ success: false, error: '无效的状态' }, 400);
  }

  try {
    // 1. 获取申请详情
    const { data: app, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*, pets(id, name)')
      .eq('id', id)
      .single();

    if (appError || !app) return c.json({ success: false, error: '申请不存在' }, 404);

    // 2. 更新申请状态
    const { error: updateError } = await supabaseAdmin.from('applications').update({ status }).eq('id', id);
    if (updateError) throw updateError;

    const pet = Array.isArray(app.pets) ? app.pets[0] : app.pets;

    // 3. 如果批准，下线宠物并发送通知
    if (status === 'approved' && pet?.id) {
      await supabaseAdmin.from('pets').update({
        status: 'none',
        description: `[已领养] ${pet.name} 已经找到了家。`,
        updated_at: new Date().toISOString()
      }).eq('id', pet.id);

      await supabaseAdmin.from('messages').insert({
        user_id: app.applicant_id,
        sender: '系统管理员',
        subject: `🎉 恭喜！领养申请已通过`,
        preview: `您对 ${pet.name} 的申请已获批。`,
        content: `恭喜！您对宠物 ${pet.name} 的申请已通过审核。我们的工作人员会尽快联系您。`,
        icon: 'bell',
        type: 'adoption',
        is_read: false
      });
    }

    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: '审批操作失败' }, 500);
  }
});

export default router;
