import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/applications
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const {
    pet_id,
    type,
    applicant_name,
    applicant_phone,
    applicant_address,
    applicant_wechat,
    applicant_bio,
    housing_type,
    housing_description,
    has_outdoor_space,
    experience_level,
  } = req.body;

  if (!pet_id || !type || !applicant_name || !applicant_phone || !applicant_address) {
    return res.status(400).json({ success: false, error: '请填写所有必填字段' });
  }

  try {
    // Check for duplicate application
    const { data: existing } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('pet_id', pet_id)
      .eq('applicant_id', req.userId)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, error: '您已经申请过这只宠物，请勿重复提交' });
    }

    // Get pet info
    const { data: pet } = await supabaseAdmin
      .from('pets')
      .select('name, breed, age, image_url, fosterer_id')
      .eq('id', pet_id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert({
        pet_id,
        applicant_id: req.userId,
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

    if (error) throw error;

    // Send notification message to applicant
    await supabaseAdmin.from('messages').insert({
      user_id: req.userId,
      sender: '萌爪家园',
      subject: `您的${type === 'adoption' ? '领养' : '寄养'}申请已提交`,
      preview: `您申请${type === 'adoption' ? '领养' : '寄养'} ${pet?.name || '该宠物'} 的申请已收到，正在审核中，请耐心等待。`,
      content: `您申请${type === 'adoption' ? '领养' : '寄养'} ${pet?.name || '该宠物'} 的申请已收到，我们将在 3-5 个工作日内与您联系。`,
      icon: 'pets',
      is_read: false,
      type: 'adoption',
    });

    // Notify the pet's fosterer if it's someone's pet
    if (pet?.fosterer_id && pet.fosterer_id !== req.userId) {
      await supabaseAdmin.from('messages').insert({
        user_id: pet.fosterer_id,
        sender: '萌爪家园',
        subject: `收到新的${type === 'adoption' ? '领养' : '寄养'}申请`,
        preview: `有人刚刚申请了${type === 'adoption' ? '领养' : '寄养'}您的宠物 ${pet?.name || ''}。`,
        content: `申请人：${applicant_name}\n联系方式：${applicant_phone}\n\n请尽快在“收到的申请”中查看并处理。`,
        icon: 'notification',
        is_read: false,
        type: 'notification',
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        id: data.id,
        pet_id: data.pet_id,
        pet_name: pet?.name,
        pet_breed: pet?.breed,
        pet_age: pet?.age,
        pet_image: pet?.image_url,
        status: data.status,
        type: data.type,
        created_at: data.created_at,
      },
    });
  } catch (err) {
    console.error('Create application error:', err);
    return res.status(500).json({ success: false, error: '提交申请失败' });
  }
});

// GET /api/applications/my
router.get('/my', requireAuth, async (req: AuthRequest, res: Response) => {
  const { type, status } = req.query;

  try {
    let query = supabaseAdmin
      .from('applications')
      .select(`
        id,
        type,
        status,
        applicant_name,
        applicant_bio,
        housing_type,
        experience_level,
        created_at,
        pet_id,
        pets (
          id,
          name,
          breed,
          age,
          image_url
        )
      `)
      .eq('applicant_id', req.userId)
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type as string);
    if (status) query = query.eq('status', status as string);

    const { data, error } = await query;
    if (error) throw error;

    const apps = (data || []).map((a: Record<string, unknown>) => {
      const pet = a.pets as Record<string, unknown> | null;
      return {
        id: a.id,
        petName: pet?.name,
        petBreed: pet?.breed,
        petAge: pet?.age,
        petImage: pet?.image_url,
        petId: a.pet_id,
        status: a.status,
        type: a.type,
        applicantName: a.applicant_name,
        applicantBio: a.applicant_bio,
        created_at: a.created_at,
      };
    });

    return res.json({ success: true, data: apps });
  } catch (err) {
    console.error('Get my applications error:', err);
    return res.status(500).json({ success: false, error: '获取申请记录失败' });
  }
});

// GET /api/applications/received
router.get('/received', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    // Get pets owned by this user (foster type)
    const { data: myPets } = await supabaseAdmin
      .from('pets')
      .select('id')
      .eq('fosterer_id', req.userId)
      .eq('type', 'foster');

    if (!myPets || myPets.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const petIds = myPets.map((p: Record<string, unknown>) => p.id);

    const { data, error } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        type,
        status,
        applicant_name,
        applicant_bio,
        housing_type,
        experience_level,
        created_at,
        pet_id,
        pets (
          id,
          name,
          breed,
          age,
          image_url
        ),
        applicant:user_profiles!applicant_id (
          id,
          name,
          avatar_url
        )
      `)
      .in('pet_id', petIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const apps = (data || []).map((a: Record<string, unknown>) => {
      const pet = a.pets as Record<string, unknown> | null;
      const applicant = a.applicant as Record<string, unknown> | null;
      return {
        id: a.id,
        petName: pet?.name,
        petBreed: pet?.breed,
        petAge: pet?.age,
        petImage: pet?.image_url,
        petId: a.pet_id,
        status: a.status,
        type: a.type,
        applicantName: applicant?.name || a.applicant_name,
        applicantBio: a.applicant_bio,
        applicantAvatar: applicant?.avatar_url,
        housingType: a.housing_type,
        experienceLevel: a.experience_level,
        created_at: a.created_at,
      };
    });

    return res.json({ success: true, data: apps });
  } catch (err) {
    console.error('Get received applications error:', err);
    return res.status(500).json({ success: false, error: '获取收到的申请失败' });
  }
});

// PATCH /api/applications/:id/status
router.patch('/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['approved', 'rejected', 'reviewing'].includes(status)) {
    return res.status(400).json({ success: false, error: '无效的状态值' });
  }

  try {
    // Verify ownership: the pet must belong to this user
    const { data: app } = await supabaseAdmin
      .from('applications')
      .select('id, pet_id, applicant_id, type, pets(name, fosterer_id)')
      .eq('id', id)
      .single();

    if (!app) {
      return res.status(404).json({ success: false, error: '申请记录不存在' });
    }

    const pet = (app as any).pets as Record<string, unknown> | null;
    if (pet?.fosterer_id !== req.userId) {
      return res.status(403).json({ success: false, error: '无权操作此申请' });
    }

    const { data, error } = await supabaseAdmin
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify applicant
    const statusText = status === 'approved' ? '已通过' : '未通过';
    await supabaseAdmin.from('messages').insert({
      user_id: app.applicant_id,
      sender: '萌爪家园',
      subject: `您的申请${statusText}`,
      preview: `您申请${app.type === 'adoption' ? '领养' : '寄养'} ${pet?.name || '宠物'} 的申请${statusText}。`,
      content: `您申请${app.type === 'adoption' ? '领养' : '寄养'} ${pet?.name || '宠物'} 的申请${statusText}。${status === 'approved' ? '请等待工作人员与您进一步联系。' : '感谢您的关注，希望您能找到更合适的小伙伴。'}`,
      icon: 'pets',
      is_read: false,
      type: 'adoption',
    });

    return res.json({
      success: true,
      data: { id: data.id, status: data.status, updated_at: data.updated_at },
    });
  } catch (err) {
    console.error('Update application status error:', err);
    return res.status(500).json({ success: false, error: '更新申请状态失败' });
  }
});

export default router;
