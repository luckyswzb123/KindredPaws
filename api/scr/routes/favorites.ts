import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/favorites
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('favorites')
      .select(`
        pet_id,
        pets (
          id, name, breed, age, image_url, type, category, status
        )
      `)
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const petIds = (data || []).map((f: Record<string, unknown>) => f.pet_id as string);
    const pets = (data || []).map((f: Record<string, unknown>) => {
      const pet = f.pets as Record<string, unknown> | null;
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

    return res.json({ success: true, data: { pet_ids: petIds, pets } });
  } catch (err) {
    console.error('Get favorites error:', err);
    return res.status(500).json({ success: false, error: '获取收藏列表失败' });
  }
});

// POST /api/favorites/:petId
router.post('/:petId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { petId } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('favorites')
      .upsert(
        { user_id: req.userId, pet_id: petId },
        { onConflict: 'user_id,pet_id', ignoreDuplicates: true }
      );

    if (error) throw error;
    return res.json({ success: true, message: '已添加到收藏' });
  } catch (err) {
    console.error('Add favorite error:', err);
    return res.status(500).json({ success: false, error: '添加收藏失败' });
  }
});

// DELETE /api/favorites/:petId
router.delete('/:petId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { petId } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', req.userId)
      .eq('pet_id', petId);

    if (error) throw error;
    return res.json({ success: true, message: '已取消收藏' });
  } catch (err) {
    console.error('Remove favorite error:', err);
    return res.status(500).json({ success: false, error: '取消收藏失败' });
  }
});

export default router;
