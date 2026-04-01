import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = new Hono();

router.use('*', requireAuth);

router.get('/', async (c) => {
  const userId = c.get('userId');

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return c.json({ success: false, error: '用户资料不存在' }, 404);
    }

    const [favRes, reviewingRes, helpedRes] = await Promise.all([
      supabaseAdmin.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('applications').select('id', { count: 'exact', head: true }).eq('applicant_id', userId).eq('status', 'reviewing'),
      supabaseAdmin.from('applications').select('id', { count: 'exact', head: true }).eq('applicant_id', userId).eq('status', 'approved'),
    ]);

    return c.json({
      success: true,
      data: {
        ...profile,
        stats: {
          favorites_count: favRes.count || 0,
          reviewing_count: reviewingRes.count || 0,
          helped_count: helpedRes.count || 0,
        },
      },
    });
  } catch (err) {
    return c.json({ success: false, error: '获取资料失败' }, 500);
  }
});

router.put('/', async (c) => {
  const userId = c.get('userId');
  const userEmail = c.get('userEmail');
  const body = await c.req.json();
  const { name, bio, avatar_url, location, phone, experience, interested_in } = body;

  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
      ...(name !== undefined && { name }),
      ...(bio !== undefined && { bio }),
      ...(avatar_url !== undefined && { avatar_url }),
      ...(location !== undefined && { location }),
      ...(phone !== undefined && { phone }),
      ...(experience !== undefined && { experience }),
      ...(interested_in !== undefined && { interested_in }),
    };

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: userId,
        email: userEmail || '',
        name: name || '用户',
        ...updateData,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return c.json({
      success: true,
      data: { id: data.id, name: data.name, updated_at: data.updated_at },
    });
  } catch (err) {
    return c.json({ success: false, error: '更新失败' }, 500);
  }
});

router.post('/upload-avatar', async (c) => {
  const userId = c.get('userId');
  const { image_base64 } = await c.req.json();

  if (!image_base64) {
    return c.json({ success: false, error: '缺少图片数据' }, 400);
  }

  try {
    const base64Content = image_base64.split(',')[1];
    const mimeType = image_base64.split(';')[0].split(':')[1];
    const ext = mimeType.split('/')[1] || 'jpg';

    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const r2FileName = `avatars/${userId}_${crypto.randomUUID()}.${ext}`;

    await c.env.MY_BUCKET.put(r2FileName, bytes, {
      httpMetadata: { contentType: mimeType },
    });

    const avatarUrl = `${c.env.R2_PUBLIC_DOMAIN}/${r2FileName}`;

    await supabaseAdmin
      .from('user_profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return c.json({ success: true, data: { avatar_url: avatarUrl } });
  } catch (err: any) {
    console.error('Avatar upload error:', err);
    return c.json({ success: false, error: '头像上传失败' }, 500);
  }
});

export default router;
