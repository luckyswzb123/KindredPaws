import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = new Hono();

// GET /api/chat/:messageId
router.get('/:messageId', requireAuth, async (c) => {
  const userId = c.get('userId');
  const messageId = c.req.param('messageId');

  try {
    // Get the message/conversation head
    const { data: msg, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('user_id', userId)
      .single();

    if (msgError || !msg) {
      return c.json({ success: false, error: '对话不存在' }, 404);
    }

    // Get chat messages
    const { data: chatMsgs, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // If no chat history yet, seed with the original message content
    const history = chatMsgs && chatMsgs.length > 0 ? chatMsgs : [];

    return c.json({
      success: true,
      data: {
        conversation: {
          id: msg.id,
          sender_name: msg.sender,
          subject: msg.subject,
          type: msg.type,
        },
        messages: history.map((m: any) => ({
          id: m.id,
          content: m.content,
          sender_type: m.sender_type,
          created_at: m.created_at,
        })),
        initial_preview: msg.preview,
      },
    });
  } catch (err) {
    console.error('Get chat error:', err);
    return c.json({ success: false, error: '获取聊天记录失败' }, 500);
  }
});

// POST /api/chat/:messageId
router.post('/:messageId', requireAuth, async (c) => {
  const userId = c.get('userId');
  const messageId = c.req.param('messageId');
  const { content } = await c.req.json();

  if (!content || !content.trim()) {
    return c.json({ success: false, error: '消息内容不能为空' }, 400);
  }

  try {
    // Verify the message belongs to this user
    const { data: msg } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('id', messageId)
      .eq('user_id', userId)
      .single();

    if (!msg) {
      return c.json({ success: false, error: '无权发送此消息' }, 403);
    }

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        message_id: messageId,
        content: content.trim(),
        sender_type: 'user',
        sender_id: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({
      success: true,
      data: {
        id: data.id,
        content: data.content,
        sender_type: data.sender_type,
        created_at: data.created_at,
      },
    }, 201);
  } catch (err) {
    console.error('Send chat message error:', err);
    return c.json({ success: false, error: '发送消息失败' }, 500);
  }
});

export default router;
