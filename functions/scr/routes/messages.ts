import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = new Hono();

// GET /api/messages
router.get('/', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { type } = c.req.query();

  try {
    let query = supabaseAdmin
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (type && type !== 'all') {
      query = query.eq('type', type as string);
    }

    const { data, error } = await query;
    if (error) throw error;

    const messages = (data || []).map(formatMessage);
    const unreadCount = messages.filter((m: any) => !m.isRead).length;

    return c.json({ success: true, data: messages, unread_count: unreadCount });
  } catch (err) {
    console.error('Get messages error:', err);
    return c.json({ success: false, error: '获取消息失败' }, 500);
  }
});

// PATCH /api/messages/:id/read
router.patch('/:id/read', requireAuth, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  try {
    const { error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: '操作失败' }, 500);
  }
});

// PATCH /api/messages/read-all
router.patch('/read-all', requireAuth, async (c) => {
  const userId = c.get('userId');
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select('id');

    if (error) throw error;
    return c.json({ success: true, data: { updated_count: (data || []).length } });
  } catch (err) {
    return c.json({ success: false, error: '操作失败' }, 500);
  }
});

// DELETE /api/messages/:id
router.delete('/:id', requireAuth, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  try {
    const { error } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: '删除失败' }, 500);
  }
});

function formatMessage(row: any) {
  return {
    id: row.id,
    sender: row.sender,
    time: row.created_at,
    subject: row.subject,
    preview: row.preview,
    content: row.content,
    icon: row.icon || 'bell',
    isRead: row.is_read,
    type: row.type,
  };
}

export default router;
