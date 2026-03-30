import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, PawPrint, MessageCircle, Smartphone, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

type Mode = 'login' | 'register';

export default function Login() {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('请输入昵称'); return; }
        if (password.length < 6) { setError('密码至少6位'); return; }
        await register(email, password, name);
      }
      navigate('/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败，请重试');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface">
      {/* Brand Side */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200"
          alt="Golden Retriever"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
        <div className="absolute top-12 left-12">
          <div className="flex items-center gap-3">
            <PawPrint className="text-on-primary" size={36} />
            <span className="font-headline font-extrabold text-3xl text-on-primary tracking-tight">萌爪家园</span>
          </div>
        </div>
        <div className="absolute bottom-24 left-12 right-12">
          <h2 className="font-headline text-5xl font-bold text-on-primary leading-tight mb-4">
            寻找一份<br />跨越时光的陪伴
          </h2>
          <p className="text-on-primary/90 text-xl font-medium max-w-md">
            加入我们的社区，为流浪的小生命寻找一个温暖的家。
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile Logo */}
        <div className="md:hidden mb-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center mb-4">
            <PawPrint className="text-primary" size={32} />
          </div>
          <span className="font-headline font-extrabold text-2xl bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">萌爪家园</span>
        </div>

        <motion.div
          key={mode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 text-center md:text-left">
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight mb-2">
              {mode === 'login' ? '欢迎回来' : '创建账户'}
            </h1>
            <p className="text-on-surface-variant font-medium">
              {mode === 'login' ? '请登录您的账户以继续您的寻宠之旅' : '注册后即可申请领养心仪的小动物'}
            </p>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-sm text-error font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name (register only) */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="font-label text-sm font-semibold text-on-surface-variant px-1">昵称</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-none rounded-md focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 shadow-sm transition-all"
                      placeholder="给自己起个昵称"
                      type="text"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="font-label text-sm font-semibold text-on-surface-variant px-1">电子邮箱</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-none rounded-md focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 shadow-sm transition-all"
                  placeholder="example@email.com"
                  type="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="font-label text-sm font-semibold text-on-surface-variant">
                  {mode === 'login' ? '登录密码' : '设置密码'}
                </label>
                {mode === 'login' && (
                  <button type="button" className="text-sm font-semibold text-primary hover:text-on-primary-container transition-colors">
                    忘记密码？
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-surface-container-lowest border-none rounded-md focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline/60 shadow-sm transition-all"
                  placeholder={mode === 'register' ? '至少6位字符' : '••••••••'}
                  type={showPassword ? 'text' : 'password'}
                  required
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant"
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-full shadow-lg shadow-primary/10 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2',
                  isLoading && 'opacity-70 cursor-not-allowed'
                )}
              >
                <span>{isLoading ? '处理中...' : mode === 'login' ? '登录账户' : '立即注册'}</span>
                {!isLoading && <ArrowRight size={20} />}
              </button>
            </div>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-outline-variant/30" />
            <span className="text-xs font-bold text-outline uppercase tracking-widest">其他登录方式</span>
            <div className="h-px flex-1 bg-outline-variant/30" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-low hover:bg-surface-container-high rounded-full transition-colors">
              <MessageCircle className="text-[#07C160]" size={20} />
              <span className="text-sm font-semibold text-on-surface">微信登录</span>
            </button>
            <button className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-low hover:bg-surface-container-high rounded-full transition-colors">
              <Smartphone className="text-primary" size={20} />
              <span className="text-sm font-semibold text-on-surface">手机号登录</span>
            </button>
          </div>

          <div className="mt-10 text-center">
            <p className="text-on-surface-variant font-medium">
              {mode === 'login' ? (
                <>还没有账号？{' '}
                  <button onClick={() => { setMode('register'); setError(''); }}
                    className="text-primary font-bold hover:underline underline-offset-4 ml-1">
                    立即注册
                  </button>
                </>
              ) : (
                <>已有账号？{' '}
                  <button onClick={() => { setMode('login'); setError(''); }}
                    className="text-primary font-bold hover:underline underline-offset-4 ml-1">
                    去登录
                  </button>
                </>
              )}
            </p>
          </div>
        </motion.div>

        <div className="mt-auto pt-8 text-center max-w-xs">
          <p className="text-[10px] text-outline leading-relaxed">
            {mode === 'login' ? '登录' : '注册'}即代表您同意我们的{' '}
            <button className="underline">服务协议</button> 与{' '}
            <button className="underline">隐私政策</button>
          </p>
        </div>
      </div>
    </div>
  );
}
