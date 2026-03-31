import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase.js';

const router = new Hono();

// --- 模拟 requireAuth 中间件逻辑 ---
// 在 Hono 中，我们可以直接在路由中通过 c.get('userId') 获取用户信息
const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: '请先登录' }, 401);
  }
  const token = authHeader.split(' ')[1];
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return c.json({ success: false, error: '登录失效' }, 401);
  }
  c.set('userId', data.user.id);
  await next();
};

// GET /api/pets - 获取宠物列表
router.get('/', async (c) => {
  const { type, category, city, status, search, page = '1', limit = '20' } = c.req.query();

  try {
    let query = supabaseAdmin
      .from('pets')
      .select('*', { count: 'exact' })
      .neq('status', 'none') // 过滤掉已下线/已领养的宠物
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);
    if (category && category !== '其他') {
      query = query.eq('category', category);
    } else if (category === '其他') {
      query = query.not('category', 'in', '("狗狗","猫咪","兔子")');
    }
    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`name.ilike.%${search}%,breed.ilike.%${search}%,location.ilike.%${search}%`);
    }
    if (city) {
      query = query.ilike('location', `%${city}%`);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    query = query.range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    const pets = (data || []).map(formatPet);

    return c.json({
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
    return c.json({ success: false, error: '获取宠物列表失败' }, 500);
  }
});

// GET /api/pets/:id - 获取详情（包含可选的收藏状态检查）
router.get('/:id', async (c) => {
  const id = c.req.param('id');

  // 获取可选的 userId (Hono 方式)
  let userId: string | null = null;
  const authHeader = c.req.header('authorization');
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
      return c.json({ success: false, error: '宠物信息不存在' }, 404);
    }

    // 检查是否收藏
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

    return c.json({
      success: true,
      data: { ...formatPet(data), is_favorited: isFavorited },
    });
  } catch (err) {
    console.error('Get pet error:', err);
    return c.json({ success: false, error: '获取宠物详情失败' }, 500);
  }
});

// POST /api/pets - 发布寄养 (需要认证)
router.post('/', requireAuth, async (c) => {
  const body = await c.req.json();
  const { name, breed, age, description, category, location, image_url } = body;
  const userId = c.get('userId'); // 从 requireAuth 中间件获取

  if (!name || !breed || !age || !category || !location || !image_url) {
    return c.json({ success: false, error: '请填写所有必填字段' }, 400);
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('name')
      .eq('id', userId)
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
        fosterer_id: userId,
        fosterer_name: profile?.name || '个人寄养',
        vaccination: false,
        neutered: false,
        microchipped: false,
        personality: [],
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({ success: true, data: formatPet(data) }, 201);
  } catch (err) {
    console.error('Create pet error:', err);
    return c.json({ success: false, error: '发布寄养失败' }, 500);
  }
});

// Helper: 格式化转换函数
function formatPet(row: any) {
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
