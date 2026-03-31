import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase.js';

const router = new Hono();

/**
 * --- 认证中间件 ---
 */
const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: '请先登录' }, 401);
  }
  const token = authHeader.split(' ');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return c.json({ success: false, error: '登录失效' }, 401);
  }
  c.set('userId', data.user.id);
  await next();
};

// 应用认证
router.use('*', requireAuth);

// GET /api/favorites - 获取收藏列表
router.get('/', async (c) => {
  const userId = c.get('userId');
  try {
    const { data, error } = await supabaseAdmin
      .from('favorites')
      .select(`
        pet_id,
        pets (
          id, name, breed, age, image_url, type, category, status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const petIds = (data || []).map((f: any) => f.pet_id);
    const pets = (data || []).map((f: any) => {
      const pet = f.pets;
      return pet ? {
        id: pet.id,
        name: pet.name,
        breed: pet.breed,
        age: pet.age,
        image: pet.image_url,
        type: pet.type,
        category: pet.category,
        status: pet.status,
      } : null;
    }).filter(Boolean);

    return c.json({ success: true, data: { pet_ids: petIds, pets } });
  } catch (err) {
    console.error('Get favorites error:', err);
    return c.json({ success: false, error: '获取收藏列表失败' }, 500);
  }
});

// POST /api/favorites/:petId - 添加收藏
router.post('/:petId', async (c) => {
  const petId = c.req.param('petId');
  const userId = c.get('userId');

  try {
    const { error } = await supabaseAdmin
      .from('favorites')
      .upsert(
        { user_id: userId, pet_id: petId },
        { onConflict: 'user_id,pet_id', ignoreDuplicates: true }
      );

    if (error) throw error;
    return c.json({ success: true, message: '已添加到收藏' });
  } catch (err) {
    console.error('Add favorite error:', err);
    return c.json({ success: false, error: '添加收藏失败' }, 500);
  }
});

// DELETE /api/favorites/:petId - 取消收藏
router.delete('/:petId', async (c) => {
  const petId = c.req.param('petId');
  const userId = c.get('userId');

  try {
    const { error } = await supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('pet_id', petId);

    if (error) throw error;
    return c.json({ success: true, message: '已取消收藏' });
  } catch (err) {
    console.error('Remove favorite error:', err);
    return c.json({ success: false, error: '取消收藏失败' }, 500);
  }
});

export default router;
