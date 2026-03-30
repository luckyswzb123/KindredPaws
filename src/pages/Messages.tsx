import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Bell, PawPrint, Heart, Trash2, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Message } from '../types';
import { messagesApi } from '../lib/api';

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;

    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 259200) return `${Math.floor(diff / 86400)}天前`;
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

export default function Messages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'all' | 'notification' | 'adoption' | 'interaction'>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const fetchMessages = async () => {
    try {
      const res = await messagesApi.list(filter);
      if (res.success) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMessages = messages;

  const markAsRead = async (id: string) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, isRead: true } : msg));
    try {
      await messagesApi.markRead(id);
    } catch(err) { console.error('Mark read failed', err); }
  };

  const markAllAsRead = async () => {
    setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    try {
      await messagesApi.markAllRead();
    } catch(err) { console.error('Mark all read failed', err); }
  };

  const deleteMessage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMessages(prev => prev.filter(msg => msg.id !== id));
    if (selectedMessage?.id === id) setSelectedMessage(null);
    try {
      await messagesApi.delete(id);
    } catch(err) { console.error('Delete message failed', err); }
  };

  const handleMessageClick = (msg: Message) => {
    if (!msg.isRead) markAsRead(msg.id);
    setSelectedMessage(msg);
  };

  return (
    <div className="bg-background min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant business-shadow">
        <div className="flex items-center justify-between px-6 h-20 w-full max-w-screen-xl mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="text-on-surface hover:bg-surface-container p-2.5 rounded-xl transition-all active:scale-95"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="font-headline font-bold text-on-surface text-xl tracking-tight uppercase tracking-widest">消息中心</h1>
          <div className="flex gap-2">
            <button 
              onClick={markAllAsRead}
              className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] px-3 py-1.5 bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
            >
              全部已读
            </button>
          </div>
        </div>
      </header>

      <main className="pt-28 px-6 max-w-screen-md mx-auto">
        <div className="flex gap-4 mb-10 overflow-x-auto no-scrollbar -mx-6 px-6">
          <button 
            onClick={() => setFilter('all')}
            className={cn(
              "flex flex-col items-center gap-2 min-w-[64px] transition-all active:scale-95",
              filter === 'all' ? "scale-105" : "opacity-40"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center business-shadow border transition-all",
              filter === 'all' ? "bg-accent text-white border-accent ring-4 ring-accent/10" : "bg-white text-on-surface-variant border-outline-variant"
            )}>
              <MessageSquare size={20} />
            </div>
            <span className="font-label text-[9px] font-bold uppercase tracking-widest">全部</span>
          </button>

          <button 
            onClick={() => setFilter('notification')}
            className={cn(
              "flex flex-col items-center gap-2 min-w-[64px] transition-all active:scale-95",
              filter === 'notification' ? "scale-105" : "opacity-40"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center business-shadow border transition-all",
              filter === 'notification' ? "bg-accent text-white border-accent ring-4 ring-accent/10" : "bg-white text-on-surface-variant border-outline-variant"
            )}>
              <Bell size={20} />
            </div>
            <span className="font-label text-[9px] font-bold uppercase tracking-widest">通知</span>
          </button>

          <button 
            onClick={() => setFilter('adoption')}
            className={cn(
              "flex flex-col items-center gap-2 min-w-[64px] transition-all active:scale-95",
              filter === 'adoption' ? "scale-105" : "opacity-40"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center business-shadow border transition-all",
              filter === 'adoption' ? "bg-accent text-white border-accent ring-4 ring-accent/10" : "bg-white text-on-surface-variant border-outline-variant"
            )}>
              <PawPrint size={20} />
            </div>
            <span className="font-label text-[9px] font-bold uppercase tracking-widest">领养动态</span>
          </button>

          <button 
            onClick={() => setFilter('interaction')}
            className={cn(
              "flex flex-col items-center gap-2 min-w-[64px] transition-all active:scale-95",
              filter === 'interaction' ? "scale-105" : "opacity-40"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center business-shadow border transition-all",
              filter === 'interaction' ? "bg-accent text-white border-accent ring-4 ring-accent/10" : "bg-white text-on-surface-variant border-outline-variant"
            )}>
              <Heart size={20} />
            </div>
            <span className="font-label text-[9px] font-bold uppercase tracking-widest">互动</span>
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.25em]">
              {filter === 'all' ? '最近消息' : 
               filter === 'notification' ? '系统通知' : 
               filter === 'adoption' ? '领养动态' : '互动消息'}
            </h2>
            <span className="font-label text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{filteredMessages.length} 条消息</span>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleMessageClick(msg)}
                  className={cn(
                    "p-6 rounded-2xl flex gap-6 items-start transition-all cursor-pointer group relative overflow-hidden border",
                    msg.isRead ? "bg-surface-container-low border-outline-variant/50" : "bg-white shadow-lg border-outline-variant ring-4 ring-accent/5"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden business-shadow border",
                      msg.type === 'notification' ? "bg-accent/10 text-accent border-accent/20" :
                      msg.type === 'adoption' ? "bg-accent/10 text-accent border-accent/20" :
                      "bg-accent/10 text-accent border-accent/20"
                    )}>
                      {msg.type === 'notification' ? <Bell size={24} /> :
                       msg.type === 'adoption' ? <PawPrint size={24} /> :
                       <Heart size={24} />}
                    </div>
                    {!msg.isRead && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-white shadow-sm" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-headline font-bold text-lg text-on-surface truncate pr-2 tracking-tight">{msg.sender}</h3>
                      <span className="font-label text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest whitespace-nowrap">{formatDate(msg.time)}</span>
                    </div>
                    <p className="font-headline font-bold text-accent mb-2 truncate text-sm tracking-tight">{msg.subject}</p>
                    <p className="text-sm text-on-surface-variant line-clamp-1 font-light leading-relaxed">{msg.preview}</p>
                  </div>
                  <button 
                    onClick={(e) => deleteMessage(msg.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-2.5 text-error hover:bg-error/10 rounded-xl transition-all active:scale-95"
                  >
                    <Trash2 size={20} />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="py-24 text-center">
                <div className="w-20 h-20 bg-surface-container rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-20 business-shadow">
                  <MessageSquare size={40} />
                </div>
                <p className="font-headline font-bold text-on-surface-variant uppercase tracking-widest text-sm">暂无此类消息</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showNotificationPrompt && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-16 p-10 rounded-3xl bg-white border border-outline-variant text-center relative business-shadow-lg overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
              <button 
                onClick={() => setShowNotificationPrompt(false)}
                className="absolute top-6 right-6 text-on-surface-variant/40 hover:text-on-surface transition-colors p-2 hover:bg-surface-container rounded-xl"
              >
                <X size={24} />
              </button>
              <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 business-shadow relative z-10">
                <MessageSquare className="text-accent" size={40} />
              </div>
              <h3 className="font-headline font-bold text-on-surface text-2xl mb-3 tracking-tight">开启实时通知</h3>
              <p className="text-on-surface-variant mb-8 font-light leading-relaxed">第一时间获取领养申请进度和救助站消息，<br />让爱不再错过。</p>
              <button 
                onClick={() => setShowNotificationPrompt(false)}
                className="w-full py-5 bg-accent text-white rounded-xl font-bold text-sm business-shadow active:scale-[0.98] transition-all uppercase tracking-[0.2em]"
              >
                立即开启
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Message Detail Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMessage(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-10 business-shadow-lg overflow-hidden border border-outline-variant"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex gap-5 items-center">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center business-shadow border",
                    selectedMessage.type === 'notification' ? "bg-accent/10 text-accent border-accent/20" :
                    selectedMessage.type === 'adoption' ? "bg-accent/10 text-accent border-accent/20" :
                    "bg-accent/10 text-accent border-accent/20"
                  )}>
                    {selectedMessage.type === 'notification' ? <Bell size={28} /> :
                     selectedMessage.type === 'adoption' ? <PawPrint size={28} /> :
                     <Heart size={28} />}
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-xl text-on-surface tracking-tight">{selectedMessage.sender}</h3>
                    <p className="font-label text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mt-1">{formatDate(selectedMessage.time)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMessage(null)}
                  className="p-2.5 hover:bg-surface-container rounded-xl transition-colors active:scale-95"
                >
                  <X size={28} className="text-on-surface-variant" />
                </button>
              </div>

              <h2 className="font-headline font-bold text-2xl text-accent mb-6 tracking-tight leading-tight">{selectedMessage.subject}</h2>
              <div className="bg-surface-container-low p-8 rounded-2xl mb-10 border border-outline-variant/50">
                <p className="text-on-surface-variant leading-relaxed font-light text-base whitespace-pre-wrap">
                  {selectedMessage.content || selectedMessage.preview}
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedMessage(null)}
                  className="flex-1 py-5 bg-surface-container-low text-on-surface font-bold rounded-xl active:scale-[0.98] transition-all uppercase tracking-widest text-xs border border-outline-variant"
                >
                  关闭
                </button>
                <button 
                  onClick={() => navigate(`/chat/${selectedMessage.id}`)}
                  className="flex-1 py-5 bg-accent text-white font-bold rounded-xl business-shadow active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
                >
                  回复消息
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArrowRight({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
