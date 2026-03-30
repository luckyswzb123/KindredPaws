import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/pets
router.get('/', async (req: AuthRequest, res: Response) => {
  const { type, category, city, status, search, page = '1', limit = '20' } = req.query;

  try {
    let query = supabaseAdmin
      .from('pets')
      .select('*', { count: 'exact' })
      .neq('status', 'none') // 过滤掉已下线/已领养的宠物
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type as string);
    if (category && category !== '其他') {
      query = query.eq('category', category as string);
    } else if (category === '其他') {
      query = query.not('category', 'in', '("狗狗","猫咪","兔子")');
    }
    if (status) query = query.eq('status', status as string);
    if (search) {
      query = query.or(`name.ilike.%${search}%,breed.ilike.%${search}%,location.ilike.%${search}%`);
    }
    if (city) {
      query = query.ilike('location', `%${city}%`);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    query = query.range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Shape the response to match frontend Pet type
    const pets = (data || []).map(formatPet);

    return res.json({
      success: true,
      data: {
        pets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limitNum),
        },
      },
    });
  } catch (err) {
    console.error('Get pets error:', err);
    return res.status(500).json({ success: false, error: '获取宠物列表失败' });
  }
});

// GET /api/pets/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Get userId from token if provided (optional auth)
  let userId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data } = await supabaseAdmin.auth.getUser(token);
    userId = data?.user?.id || null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('pets')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: '宠物信息不存在' });
    }

    // Check if favorited
    let isFavorited = false;
    if (userId) {
      const { data: fav } = await supabaseAdmin
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('pet_id', id)
        .maybeSingle();
      isFavorited = !!fav;
    }

    return res.json({
      success: true,
      data: { ...formatPet(data), is_favorited: isFavorited },
    });
  } catch (err) {
    console.error('Get pet error:', err);
    return res.status(500).json({ success: false, error: '获取宠物详情失败' });
  }
});

// POST /api/pets - 发布寄养
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, breed, age, description, category, location, image_url } = req.body;

  if (!name || !breed || !age || !category || !location || !image_url) {
    return res.status(400).json({ success: false, error: '请填写所有必填字段' });
  }

  try {
    // Get the poster's profile name
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('name')
      .eq('id', req.userId)
      .single();

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
        type: 'foster',
        status: 'new',
        fosterer_id: req.userId,
        fosterer_name: profile?.name || '个人寄养',
        vaccination: false,
        neutered: false,
        microchipped: false,
        personality: [],
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, data: formatPet(data) });
  } catch (err) {
    console.error('Create pet error:', err);
    return res.status(500).json({ success: false, error: '发布寄养失败' });
  }
});

// Helper: format DB row → frontend Pet shape
function formatPet(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    breed: row.breed,
    age: row.age,
    weight: row.weight,
    gender: row.gender,
    location: row.location,
    distance: row.distance || '未知',
    image: row.image_url,
    description: row.description,
    personality: row.personality || [],
    status: row.status,
    type: row.type,
    category: row.category,
    fosterer_name: row.fosterer_name,
    healthStatus: {
      vaccination: row.vaccination,
      neutered: row.neutered,
      microchipped: row.microchipped,
    },
    created_at: row.created_at,
  };
}

export default router;
