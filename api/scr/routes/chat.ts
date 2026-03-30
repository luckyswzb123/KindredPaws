import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/chat/:messageId
router.get('/:messageId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { messageId } = req.params;

  try {
    // Get the message/conversation head
    const { data: msg, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('user_id', req.userId)
      .single();

    if (msgError || !msg) {
      return res.status(404).json({ success: false, error: '对话不存在' });
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

    return res.json({
      success: true,
      data: {
        conversation: {
          id: msg.id,
          sender_name: msg.sender,
          subject: msg.subject,
          type: msg.type,
        },
        messages: history.map((m: Record<string, unknown>) => ({
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
    return res.status(500).json({ success: false, error: '获取聊天记录失败' });
  }
});

// POST /api/chat/:messageId
router.post('/:messageId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { messageId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: '消息内容不能为空' });
  }

  try {
    // Verify the message belongs to this user
    const { data: msg } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('id', messageId)
      .eq('user_id', req.userId)
      .single();

    if (!msg) {
      return res.status(403).json({ success: false, error: '无权发送此消息' });
    }

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        message_id: messageId,
        content: content.trim(),
        sender_type: 'user',
        sender_id: req.userId,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data: {
        id: data.id,
        content: data.content,
        sender_type: data.sender_type,
        created_at: data.created_at,
      },
    });
  } catch (err) {
    console.error('Send chat message error:', err);
    return res.status(500).json({ success: false, error: '发送消息失败' });
  }
});

export default router;
