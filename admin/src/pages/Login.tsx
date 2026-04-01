import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail, Loader2, PawPrint } from 'lucide-react';
import { adminApi } from '../lib/api';
import { persistAdminSession } from '../lib/auth';

function getLoginErrorMessage(error: any) {
  const apiMessage = error?.response?.data?.error;
  const message = error?.message || '';

  if (apiMessage) {
    return apiMessage;
  }

  if (message.includes('Failed to fetch') || message.includes('Network Error')) {
    return '无法连接到后台登录服务，请确认本地 dev:functions 已启动，或检查网络后重试。';
  }

  return message || '登录失败，请检查输入后重试。';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.login(email, password);
      const payload = response.data;

      if (!payload?.success) {
        setError(payload?.error || '登录失败，请检查输入后重试。');
        return;
      }

      if (payload?.data?.session) {
        persistAdminSession(payload.data.session, payload.data.user);
        navigate('/', { replace: true });
      } else {
        setError('登录成功，但没有收到有效会话，请稍后重试。');
      }
    } catch (err: any) {
      console.error('Admin login failed:', err);
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F6] flex items-center justify-center p-6 relative overflow-hidden">
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

          {error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 animate-shake">
              {error}
            </div>
          ) : null}

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

        <p className="text-center mt-10 text-gray-400 text-sm">&copy; 2026 Kindred Paws Admin</p>
      </div>
    </div>
  );
}
