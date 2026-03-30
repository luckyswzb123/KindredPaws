import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, MoreVertical, Phone, Video, Image, Smile, Plus } from 'lucide-react';
import { MOCK_MESSAGES } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
}

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const messageInfo = MOCK_MESSAGES.find(m => m.id === id) || MOCK_MESSAGES[0];

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { 
      id: '0', 
      text: messageInfo.preview || '你好！很高兴收到你的领养申请。', 
      sender: 'other', 
      time: messageInfo.time 
    },
    { id: '1', text: '我们非常欢迎你这周六 10 点过来救助站看看 Milo。', sender: 'other', time: '上午 10:46' },
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory([...chatHistory, newMessage]);
    setInputText('');

    // Simulate auto-reply
    setTimeout(() => {
      const reply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: '收到！我们会尽快处理您的回复。期待与您见面！',
        sender: 'other',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory(prev => [...prev, reply]);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md shadow-sm shadow-stone-200/50">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="text-on-surface hover:opacity-80 transition-opacity active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {messageInfo.sender[0]}
              </div>
              <div>
                <h1 className="font-headline font-black text-on-surface text-base leading-tight">{messageInfo.sender}</h1>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider">在线</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <button className="hover:text-primary transition-colors"><Phone size={20} /></button>
            <button className="hover:text-primary transition-colors"><Video size={20} /></button>
            <button className="hover:text-primary transition-colors"><MoreVertical size={20} /></button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main 
        ref={scrollRef}
        className="flex-1 pt-20 pb-24 px-6 overflow-y-auto no-scrollbar space-y-6"
      >
        <div className="text-center py-4">
          <span className="text-[10px] font-bold text-outline bg-surface-container-low px-3 py-1 rounded-full uppercase tracking-widest">今天</span>
        </div>

        <AnimatePresence initial={false}>
          {chatHistory.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex w-full",
                msg.sender === 'me' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[80%] flex flex-col",
                msg.sender === 'me' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm font-medium shadow-sm",
                  msg.sender === 'me' 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-white text-on-surface rounded-tl-none border border-stone-100"
                )}>
                  {msg.text}
                </div>
                <span className="text-[9px] font-bold text-outline mt-1 px-1">{msg.time}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* Input Area */}
      <footer className="fixed bottom-0 w-full bg-background/80 backdrop-blur-md border-t border-stone-100 p-4 pb-safe z-50">
        <div className="max-w-screen-md mx-auto flex items-center gap-3">
          <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
            <Plus size={24} />
          </button>
          <div className="flex-1 relative">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              className="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary rounded-2xl py-3 pl-4 pr-12 text-sm text-on-surface transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button className="text-on-surface-variant hover:text-primary transition-colors"><Smile size={20} /></button>
            </div>
          </div>
          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90",
              inputText.trim() ? "bg-primary text-white shadow-lg shadow-orange-200" : "bg-surface-container-low text-outline-variant"
            )}
          >
            <Send size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}
