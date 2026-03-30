import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAdminAuth, AuthRequest as AdminRequest } from '../middleware/auth.js';

const router = Router();

// Apply auth middleware to all admin routes
router.use(requireAdminAuth);

// GET /api/admin/stats - Overview counts for dashboard
router.get('/stats', async (req: AdminRequest, res: Response) => {
  try {
    const { count: petsCount } = await supabaseAdmin
      .from('pets')
      .select('*', { count: 'exact', head: true });

    const { count: pendingCount } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'reviewing');

    const { count: approvedCount } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: usersCount } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    return res.json({
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
    return res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
});

// GET /api/admin/pets - List all pets including those not published
router.get('/pets', async (req: AdminRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Admin get pets error:', err);
    return res.status(500).json({ success: false, error: '获取后台宠物列表失败' });
  }
});

// POST /api/admin/pets - Create new pet record
router.post('/pets', async (req: AdminRequest, res: Response) => {
  const { name, breed, age, description, category, location, image_url, type, status, personality, healthStatus } = req.body;

  if (!name || !breed || !age || !category || !location || !image_url) {
    return res.status(400).json({ success: false, error: '必填字段缺失' });
  }

  try {
    console.log(`[Admin] Attempting to insert new pet: ${name}...`);
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
      console.error('[Admin] Supabase Insert Error:', error);
      throw error;
    }

    console.log('[Admin] Pet inserted successfully:', data.id);
    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    console.error('Admin create pet error:', err);
    return res.status(500).json({ success: false, error: `录入宠物失败: ${err.message || '未知错误'}` });
  }
});

// PUT /api/admin/pets/:id - Update pet record
router.put('/pets/:id', async (req: AdminRequest, res: Response) => {
  const { id } = req.params;
  const { name, breed, age, description, category, location, image_url, type, status, personality, healthStatus } = req.body;

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

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Admin update pet error:', err);
    return res.status(500).json({ success: false, error: '更新宠物信息失败' });
  }
});

// DELETE /api/admin/pets/:id - Delete pet record
router.delete('/pets/:id', async (req: AdminRequest, res: Response) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin
      .from('pets')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.json({ success: true, message: '宠物已成功从库中移除' });
  } catch (err) {
    console.error('Admin delete pet error:', err);
    return res.status(500).json({ success: false, error: '删除失败' });
  }
});

// PATCH /api/admin/pets/:id/status - Quick status toggle
router.patch('/pets/:id/status', async (req: AdminRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const { error } = await supabaseAdmin
      .from('pets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: '更新状态失败' });
  }
});

// GET /api/admin/applications - List all user applications
router.get('/applications', async (req: AdminRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        pets (name, breed, image_url),
        user_profiles (name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Applications select error:', error);
      throw error;
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Admin get applications error:', err);
    return res.status(500).json({ success: false, error: '获取后台申请列表失败' });
  }
});

// PATCH /api/admin/applications/:id/status - Approve or Reject and sync pet status
router.patch('/applications/:id/status', async (req: AdminRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: '无效的审批状态' });
  }

  try {
    // 1. Get current application and pet info
    const { data: app, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*, pets(id, name)')
      .eq('id', id)
      .single();

    if (appError || !app) return res.status(404).json({ success: false, error: '申请不存在' });

    // 2. Update application status
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({ status })
      .eq('id', id);

    if (updateError) throw updateError;

    // Handle both single object or array return from pets join
    const rawPet = (app as any).pets;
    const pet = Array.isArray(rawPet) ? rawPet[0] : rawPet;

    // 3. If approved, update pet status to 'none' (not urgent/new) and message user
    if (status === 'approved' && pet && pet.id) {
      console.log(`[Admin] Approval confirmed. Offlining pet ${pet.id}...`);
      const { error: petUpdateError } = await supabaseAdmin
        .from('pets')
        .update({
          status: 'none',
          description: `[已领养] ${pet.name} 已经找到了温暖家。我们的故事还在继续...`,
          updated_at: new Date().toISOString()
        })
        .eq('id', pet.id);

      if (petUpdateError) {
        console.error('[Admin] Pet offline update failed:', petUpdateError);
      }

      // Notify user via message center
      await supabaseAdmin.from('messages').insert({
        user_id: app.applicant_id,
        sender: '系统管理员',
        subject: `🎉 恭喜！您的领养申请已获批`,
        preview: `您对 ${pet.name} 的领养申请已通过审核。`,
        content: `亲爱的用户，我们很高兴地通知您，您对宠物 ${pet.name} 的领养申请已经通过后台审核！我们的工作人员将在近日与您取得联系，请保持手机畅顺并留意新消息。恭喜您可以带毛孩子回家了！`,
        icon: 'bell',
        type: 'adoption',
        is_read: false
      });
    } else {
      console.log('[Admin] Request rejected or pet info missing, skip offline.');
      // Notify rejection
      await supabaseAdmin.from('messages').insert({
        user_id: app.applicant_id,
        sender: '系统管理员',
        subject: `关于领养申请的反馈`,
        preview: `很抱歉，您的领养申请暂未通过。`,
        content: `亲爱的用户，很抱歉告知您，经过综合评估，您目前对 ${pet.name} 的申请未能通过。感谢您对流浪动物的关注，欢迎您关注库内其他待领养的毛孩子。`,
        icon: 'bell',
        type: 'interaction',
        is_read: false
      });
    }

    return res.json({ success: true, message: `已成功${status === 'approved' ? '批准' : '拒绝'}该申请` });
  } catch (err) {
    console.error('Admin approval error:', err);
    return res.status(500).json({ success: false, error: '审批操作失败' });
  }
});

export default router;
