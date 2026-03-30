import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/messages
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { type } = req.query;

  try {
    let query = supabaseAdmin
      .from('messages')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (type && type !== 'all') {
      query = query.eq('type', type as string);
    }

    const { data, error } = await query;
    if (error) throw error;

    const messages = (data || []).map(formatMessage);
    const unreadCount = messages.filter((m: Record<string, unknown>) => !m.isRead).length;

    return res.json({ success: true, data: messages, unread_count: unreadCount });
  } catch (err) {
    console.error('Get messages error:', err);
    return res.status(500).json({ success: false, error: '获取消息失败' });
  }
});

// PATCH /api/messages/:id/read
router.patch('/:id/read', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: '操作失败' });
  }
});

// PATCH /api/messages/read-all
router.patch('/read-all', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('user_id', req.userId)
      .eq('is_read', false)
      .select('id');

    if (error) throw error;
    return res.json({ success: true, data: { updated_count: (data || []).length } });
  } catch (err) {
    return res.status(500).json({ success: false, error: '操作失败' });
  }
});

// DELETE /api/messages/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: '删除失败' });
  }
});

function formatMessage(row: Record<string, unknown>) {
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
