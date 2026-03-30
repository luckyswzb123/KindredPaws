import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import r2, { BUCKET_NAME, PUBLIC_DOMAIN } from '../lib/r2.js';
import crypto from 'crypto';

const router = Router();

// GET /api/profile
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({ success: false, error: '用户资料不存在' });
    }

    // Get stats
    const [{ count: favCount }, { count: reviewingCount }, { count: helpedCount }] = await Promise.all([
      supabaseAdmin.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', req.userId),
      supabaseAdmin.from('applications').select('id', { count: 'exact', head: true }).eq('applicant_id', req.userId).eq('status', 'reviewing'),
      supabaseAdmin.from('applications').select('id', { count: 'exact', head: true }).eq('applicant_id', req.userId).eq('status', 'approved'),
    ]);

    return res.json({
      success: true,
      data: {
        id: profile.id,
        name: profile.name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        location: profile.location,
        email: profile.email,
        phone: profile.phone,
        experience: profile.experience,
        interested_in: profile.interested_in,
        stats: {
          favorites_count: favCount || 0,
          reviewing_count: reviewingCount || 0,
          helped_count: helpedCount || 0,
        },
      },
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ success: false, error: '获取用户资料失败' });
  }
});

// PUT /api/profile
router.put('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, bio, avatar_url, location, phone, experience, interested_in } = req.body;

  try {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (location !== undefined) updateData.location = location;
    if (phone !== undefined) updateData.phone = phone;
    if (experience !== undefined) updateData.experience = experience;
    if (interested_in !== undefined) updateData.interested_in = interested_in;

    // Auto-heal missing profiles by using upsert
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: req.userId,
        email: req.userEmail || '',
        name: name || '用户', // name is NOT NULL in db
        ...updateData
      })
      .select()
      .single();

    if (error) {
      console.error('[DEBUG] Upsert profile error:', error);
      throw error;
    }

    return res.json({
      success: true,
      data: { id: data.id, name: data.name, updated_at: data.updated_at },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, error: '更新资料失败' });
  }
});

// POST /api/profile/upload-avatar
router.post('/upload-avatar', requireAuth, async (req: AuthRequest, res: Response) => {
  const { image_base64, file_name } = req.body;

  if (!image_base64 || !file_name) {
    return res.status(400).json({ success: false, error: '缺少图片数据' });
  }

  try {
    // Convert base64 to buffer
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = image_base64.split(';')[0].split('/')[1] || 'jpg';

    // Generate unique name for R2
    const r2FileName = `avatars/${req.userId}_${crypto.randomUUID()}.${ext}`;

    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2FileName,
      Body: buffer,
      ContentType: `image/${ext}`,
    });

    await r2.send(uploadCommand);
    const avatar_url = `${PUBLIC_DOMAIN}/${r2FileName}`;

    console.log(`[AVATAR UPLOAD] Success: ${avatar_url}`);

    // Update profile avatar
    await supabaseAdmin
      .from('user_profiles')
      .update({ avatar_url, updated_at: new Date().toISOString() })
      .eq('id', req.userId);

    return res.json({ success: true, data: { avatar_url } });
  } catch (err: any) {
    console.error('Upload avatar error:', err);
    return res.status(500).json({ success: false, error: `头像上传失败: ${err.message}` });
  }
});

export default router;
