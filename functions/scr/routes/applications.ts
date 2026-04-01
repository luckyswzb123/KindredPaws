import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = new Hono();

router.use('*', requireAuth);

router.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const {
    pet_id, type, applicant_name, applicant_phone, applicant_address,
    applicant_wechat, applicant_bio, housing_type, housing_description,
    has_outdoor_space, experience_level,
  } = body;

  if (!pet_id || !type || !applicant_name || !applicant_phone || !applicant_address) {
    return c.json({ success: false, error: '请填写所有必填字段' }, 400);
  }

  try {
    const { data: existing } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('pet_id', pet_id)
      .eq('applicant_id', userId)
      .maybeSingle();

    if (existing) {
      return c.json({ success: false, error: '您已经申请过这只宠物，请勿重复提交' }, 409);
    }

    const { data: pet } = await supabaseAdmin
      .from('pets')
      .select('name, breed, age, image_url, fosterer_id')
      .eq('id', pet_id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert({
        pet_id,
        applicant_id: userId,
        type,
        status: 'reviewing',
        applicant_name,
        applicant_phone,
        applicant_address,
        applicant_wechat: applicant_wechat || null,
        applicant_bio: applicant_bio || null,
        housing_type: housing_type || null,
        housing_description: housing_description || null,
        has_outdoor_space: has_outdoor_space ?? false,
        experience_level: experience_level || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await supabaseAdmin.from('messages').insert({
      user_id: userId,
      sender: '萌爪家园',
      subject: `您的${type === 'adoption' ? '领养' : '寄养'}申请已提交`,
      preview: `您申请${type === 'adoption' ? '领养' : '寄养'} ${pet?.name || '该宠物'} 的申请已收到。`,
      content: `您对 ${pet?.name || '该宠物'} 的申请已收到，我们将在 3-5 个工作日内处理。`,
      icon: 'pets',
      is_read: false,
      type: 'adoption',
    });

    if (pet?.fosterer_id && pet.fosterer_id !== userId) {
      await supabaseAdmin.from('messages').insert({
        user_id: pet.fosterer_id,
        sender: '萌爪家园',
        subject: `收到新的${type === 'adoption' ? '领养' : '寄养'}申请`,
        preview: `有人申请了您的宠物 ${pet?.name || ''}。`,
        content: `申请人：${applicant_name}\n联系方式：${applicant_phone}\n请在“收到的申请”中查看。`,
        icon: 'notification',
        is_read: false,
        type: 'notification',
      });
    }

    return c.json({
      success: true,
      data: {
        id: data.id,
        pet_id: data.pet_id,
        pet_name: pet?.name,
        pet_breed: pet?.breed,
        pet_image: pet?.image_url,
        status: data.status,
        type: data.type,
        created_at: data.created_at,
      },
    }, 201);
  } catch (err) {
    console.error('Create application error:', err);
    return c.json({ success: false, error: '提交申请失败' }, 500);
  }
});

router.get('/my', async (c) => {
  const userId = c.get('userId');
  const { type, status } = c.req.query();

  try {
    let query = supabaseAdmin
      .from('applications')
      .select(`
        id, type, status, applicant_name, applicant_bio, housing_type, experience_level, created_at, pet_id,
        pets ( id, name, breed, age, image_url )
      `)
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const apps = (data || []).map((a: any) => ({
      id: a.id,
      petName: a.pets?.name,
      petBreed: a.pets?.breed,
      petAge: a.pets?.age,
      petImage: a.pets?.image_url,
      petId: a.pet_id,
      status: a.status,
      type: a.type,
      applicantName: a.applicant_name,
      applicantBio: a.applicant_bio,
      created_at: a.created_at,
    }));

    return c.json({ success: true, data: apps });
  } catch (err) {
    return c.json({ success: false, error: '获取申请记录失败' }, 500);
  }
});

router.get('/received', async (c) => {
  const userId = c.get('userId');

  try {
    const { data: myPets } = await supabaseAdmin
      .from('pets')
      .select('id')
      .eq('fosterer_id', userId)
      .eq('type', 'foster');

    if (!myPets || myPets.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const petIds = myPets.map((p: any) => p.id);

    const { data, error } = await supabaseAdmin
      .from('applications')
      .select(`
        id, type, status, applicant_name, applicant_bio, housing_type, experience_level, created_at, pet_id,
        pets ( id, name, breed, age, image_url ),
        applicant:user_profiles!applicant_id ( id, name, avatar_url )
      `)
      .in('pet_id', petIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const apps = (data || []).map((a: any) => ({
      id: a.id,
      petName: a.pets?.name,
      petBreed: a.pets?.breed,
      petAge: a.pets?.age,
      petImage: a.pets?.image_url,
      petId: a.pet_id,
      status: a.status,
      type: a.type,
      applicantName: a.applicant?.name || a.applicant_name,
      applicantBio: a.applicant_bio,
      applicantAvatar: a.applicant?.avatar_url,
      housingType: a.housing_type,
      experienceLevel: a.experience_level,
      created_at: a.created_at,
    }));

    return c.json({ success: true, data: apps });
  } catch (err) {
    return c.json({ success: false, error: '获取收到的申请失败' }, 500);
  }
});

router.patch('/:id/status', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const { status } = await c.req.json();

  if (!status || !['approved', 'rejected', 'reviewing'].includes(status)) {
    return c.json({ success: false, error: '无效的状态值' }, 400);
  }

  try {
    const { data: app } = await supabaseAdmin
      .from('applications')
      .select('id, pet_id, applicant_id, type, pets(name, fosterer_id)')
      .eq('id', id)
      .single();

    if (!app) {
      return c.json({ success: false, error: '申请记录不存在' }, 404);
    }

    const pet = Array.isArray(app.pets) ? app.pets[0] : app.pets;
    if (pet?.fosterer_id !== userId) {
      return c.json({ success: false, error: '无权操作此申请' }, 403);
    }

    const { error } = await supabaseAdmin
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }

    const statusText = status === 'approved' ? '已通过' : status === 'rejected' ? '未通过' : '审核中';

    await supabaseAdmin.from('messages').insert({
      user_id: app.applicant_id,
      sender: '萌爪家园',
      subject: '申请状态已更新',
      preview: `您对 ${pet?.name} 的申请${statusText}。`,
      content: `您的申请状态已更新为：${statusText}。`,
      icon: 'bell',
      type: 'adoption',
      is_read: false,
    });

    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: '更新失败' }, 500);
  }
});

export default router;
