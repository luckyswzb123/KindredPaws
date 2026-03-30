import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, Lock, Mail, Loader2, PawPrint } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.session) {
        localStorage.setItem('kp_access_token', data.session.access_token);
        // We'll trust the token for now, the backend will verify if it's REALLY an admin
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请检查您的凭据');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F6] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-orange-200/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-accent/10 border border-white p-10 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-accent/30 rotate-3">
            <PawPrint className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">萌爪家园</h1>
          <p className="text-gray-500 mt-2 font-medium">后台管理系统</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">管理员邮箱</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
              <input
                type="email"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-accent/50 outline-none transition-all placeholder:text-gray-300"
                placeholder="admin@kindredpaws.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">登录密码</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-accent/50 outline-none transition-all placeholder:text-gray-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-accent hover:bg-accent-dark text-white rounded-2xl font-bold shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                立即登录
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-10 text-gray-400 text-sm">
          &copy; 2026 Kindred Paws Admin
        </p>
      </div>
    </div>
  );
}
