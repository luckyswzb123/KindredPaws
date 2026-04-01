import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, FileText, Heart, Loader2, PawPrint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../lib/api';
import { cn } from '../lib/utils';

const StatCard = ({ icon, label, value, trend, trendValue, onClick }: any) => (
  <div
    onClick={onClick}
    className="bg-white p-8 rounded-3xl business-shadow border border-outline-variant flex flex-col gap-6 group hover:border-accent transition-all cursor-pointer relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
      <ArrowUpRight className="text-accent" size={24} />
    </div>
    <div className="flex justify-between items-start">
      <div className="w-14 h-14 bg-accent/5 rounded-2xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all business-shadow-sm border border-accent/10">
        {icon}
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-lg border border-outline-variant/30">
        {trend === 'up' ? <ArrowUpRight size={12} className="text-green-600" /> : <ArrowDownRight size={12} className="text-red-600" />}
        <span className={cn('text-[10px] font-bold uppercase tracking-widest', trend === 'up' ? 'text-green-600' : 'text-red-600')}>
          {trendValue}
        </span>
      </div>
    </div>
    <div>
      <h3 className="text-on-surface-variant font-headline text-[11px] uppercase tracking-[0.2em] font-bold mb-2 opacity-60">{label}</h3>
      <p className="text-4xl font-headline font-bold text-on-surface tracking-tight">{value}</p>
    </div>
  </div>
);

function resolveErrorMessage(error: any) {
  const status = error?.response?.status;
  const apiMessage = error?.response?.data?.error;

  if (status === 403) {
    return '当前账号已登录，但没有管理员权限。请先在 Supabase 的 user_profiles 表中把 is_admin 设为 true。';
  }

  if (status === 401) {
    return '登录状态已失效，请重新登录后台。';
  }

  return apiMessage || error?.message || '加载仪表盘失败，请稍后重试。';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchStats = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await adminApi.getStats();
      if (res.data.success) {
        setStats(res.data.data);
      } else {
        setErrorMessage(res.data.error || '加载仪表盘失败。');
      }
    } catch (error: any) {
      console.error(error);
      setStats(null);
      setErrorMessage(resolveErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
        <Loader2 size={48} className="animate-spin text-accent/20" />
        <p className="font-headline font-bold text-on-surface-variant/40 uppercase tracking-widest text-sm italic">数据同步中...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="space-y-8 pb-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight">管理概览</h1>
          <p className="text-on-surface-variant text-base font-light font-sans italic opacity-80">
            后台入口已经打开，但当前账号暂时无法读取管理数据。
          </p>
        </header>

        <div className="bg-white rounded-3xl business-shadow border border-outline-variant p-10">
          <div className="max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-6 text-amber-900">
            <div className="flex items-start gap-4">
              <AlertTriangle className="shrink-0 mt-0.5" size={20} />
              <div className="space-y-3">
                <div className="font-headline font-bold uppercase tracking-widest text-xs">管理数据暂时不可用</div>
                <p className="text-sm leading-6">{errorMessage}</p>
                <button
                  onClick={fetchStats}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold uppercase tracking-widest hover:bg-amber-100 transition-all"
                >
                  重试加载
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight">管理概览</h1>
        <p className="text-on-surface-variant text-base font-light font-sans italic opacity-80">
          欢迎回来，管理员。今天数据库运行平稳，所有申请都在处理队列中。
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard onClick={() => navigate('/pets')} icon={<PawPrint size={28} />} label="在库宠物总数" value={stats?.pets || 0} trend="up" trendValue="+2% 本周" />
        <StatCard onClick={() => navigate('/applications')} icon={<FileText size={28} />} label="待审领养申请" value={stats?.pending || 0} trend="down" trendValue="-1 今日" />
        <StatCard onClick={() => navigate('/applications')} icon={<Heart size={28} />} label="累计领养完成" value={stats?.approved || 0} trend="up" trendValue="持续增长" />
        <StatCard onClick={() => navigate('/users')} icon={<Activity size={28} />} label="系统注册用户" value={stats?.users || 0} trend="up" trendValue="新入站" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-white p-10 rounded-3xl business-shadow border border-outline-variant min-h-[450px] flex flex-col">
          <h2 className="font-headline font-bold text-xl text-on-surface mb-8 tracking-widest uppercase">库内数据变动趋势</h2>
          <div className="flex-1 flex items-center justify-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant">
            <div className="text-center">
              <Activity size={48} className="text-accent/20 mx-auto mb-4" />
              <p className="font-headline font-bold text-on-surface-variant/40 uppercase tracking-widest text-sm italic">交互式可视化图表加载中...</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 bg-white p-10 rounded-3xl business-shadow border border-outline-variant min-h-[450px] flex flex-col">
          <h2 className="font-headline font-bold text-xl text-on-surface mb-8 tracking-widest uppercase">快捷管理工具</h2>
          <div className="grid grid-cols-1 gap-4">
            <button onClick={() => navigate('/pets')} className="w-full py-5 text-xs font-bold uppercase tracking-[0.2em] text-on-surface bg-surface-container-low border border-outline-variant rounded-2xl hover:bg-accent hover:text-white hover:border-accent transition-all hover:scale-[1.02] active:scale-[0.98] business-shadow-sm">
              发布新成员
            </button>
            <button onClick={() => navigate('/users')} className="w-full py-5 text-xs font-bold uppercase tracking-[0.2em] text-on-surface border border-outline-variant rounded-2xl hover:bg-surface-container transition-all">
              管理用户角色
            </button>
            <button className="w-full py-5 text-xs font-bold uppercase tracking-[0.2em] text-on-surface border border-outline-variant rounded-2xl hover:bg-surface-container transition-all">
              批量导出数据
            </button>
            <div className="mt-auto pt-8 border-t border-outline-variant">
              <div className="p-6 bg-accent/5 rounded-2xl border border-accent/10">
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2 font-headline italic">数据库状态：在线</p>
                <p className="text-xs text-on-surface-variant font-sans leading-relaxed">
                  当前版本支持 AWS S3 协议 Cloudflare R2 云存储。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
