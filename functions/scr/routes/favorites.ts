import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = new Hono();

router.use('*', requireAuth);

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

    if (error) {
      throw error;
    }

    const petIds = (data || []).map((f: any) => f.pet_id);
    const pets = (data || [])
      .map((f: any) => {
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
      })
      .filter(Boolean);

    return c.json({ success: true, data: { pet_ids: petIds, pets } });
  } catch (err) {
    console.error('Get favorites error:', err);
    return c.json({ success: false, error: '获取收藏列表失败' }, 500);
  }
});

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

    if (error) {
      throw error;
    }

    return c.json({ success: true, message: '已添加到收藏' });
  } catch (err) {
    console.error('Add favorite error:', err);
    return c.json({ success: false, error: '添加收藏失败' }, 500);
  }
});

router.delete('/:petId', async (c) => {
  const petId = c.req.param('petId');
  const userId = c.get('userId');

  try {
    const { error } = await supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('pet_id', petId);

    if (error) {
      throw error;
    }

    return c.json({ success: true, message: '已取消收藏' });
  } catch (err) {
    console.error('Remove favorite error:', err);
    return c.json({ success: false, error: '取消收藏失败' }, 500);
  }
});

export default router;
