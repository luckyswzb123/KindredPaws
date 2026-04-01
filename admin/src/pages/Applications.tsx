import { useEffect, useState } from 'react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { adminApi } from '../lib/api';
import { cn } from '../lib/utils';

function getErrorMessage(error: any) {
  const status = error?.response?.status;
  const apiMessage = error?.response?.data?.error;

  if (status === 403) {
    return '当前账号没有管理员权限。请先在 user_profiles.is_admin 中授予管理员权限。';
  }

  if (status === 401) {
    return '登录状态已失效，请重新登录后台。';
  }

  return apiMessage || error?.message || '审批失败，请稍后重试';
}

export default function Applications() {
  const [apps, setApps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void fetchApps();
  }, []);

  const fetchApps = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getApplications();
      if (res.data.success) {
        setApps(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    const confirmMsg =
      status === 'approved'
        ? '确认批准该申请？用户将收到通知并进入后续领养流程。'
        : '确定要拒绝该申请吗？';

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const res = await adminApi.updateApplicationStatus(id, status);
      if (res.data.success) {
        await fetchApps();
      } else {
        alert(res.data.error || '审批失败，请稍后重试');
      }
    } catch (err: any) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight">领养申请审核</h1>
        <p className="text-on-surface-variant text-base font-light font-sans italic opacity-80">
          在这里处理来自所有用户的宠物领养或寄养申请。批准后，系统会自动向用户发送站内消息。
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {isLoading ? (
          <div className="py-40 text-center flex flex-col items-center gap-6">
            <Loader2 size={48} className="animate-spin text-accent/20" />
            <span className="font-headline font-bold text-on-surface-variant/40 uppercase tracking-widest text-sm italic">
              申请数据加载中...
            </span>
          </div>
        ) : apps.length === 0 ? (
          <div className="py-40 text-center bg-white rounded-3xl border border-outline-variant/50 business-shadow">
            <div className="text-on-surface-variant/40 italic font-light">暂无待处理的申请记录</div>
          </div>
        ) : (
          apps.map((app) => (
            <div
              key={app.id}
              className="bg-white p-10 rounded-3xl business-shadow border border-outline-variant grid grid-cols-1 lg:grid-cols-12 gap-10 items-center group hover:border-accent transition-all animate-in fade-in slide-in-from-bottom-5"
            >
              <div className="lg:col-span-3 flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-surface-container-low overflow-hidden border border-outline-variant shrink-0 business-shadow-lg p-0.5">
                  <img
                    src={app.user_profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${app.applicant_name}`}
                    className="w-full h-full object-cover rounded-[14px]"
                    alt="Avatar"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="font-headline font-bold text-xl text-on-surface tracking-tight truncate">
                    {app.user_profiles?.name || app.applicant_name}
                  </h3>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.2em] mt-2 font-mono">
                    {app.applicant_phone}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-3 flex flex-col gap-2.5">
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest px-1">申请目标宠物</span>
                <div className="flex items-center gap-4 bg-accent/5 p-3 rounded-[20px] border border-accent/10 pr-6">
                  <div className="w-12 h-12 rounded-xl bg-white overflow-hidden border border-outline-variant shrink-0 business-shadow p-0.5 flex items-center justify-center">
                    <img
                      src={app.pets?.image_url}
                      className="w-full h-full object-cover rounded-lg"
                      alt={app.pets?.name}
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline font-bold text-sm text-accent truncate tracking-tight">
                      {app.pets?.name || '未知宠物'}
                    </span>
                    <span className="text-[10px] text-accent/60 italic font-bold uppercase tracking-widest mt-0.5">
                      {app.pets?.breed || '未知品种'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3 p-6 bg-surface-container-low/50 rounded-2xl border border-outline-variant/30 backdrop-blur-sm">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">申请自述与家庭背景</span>
                <p className="text-sm text-on-surface-variant leading-relaxed font-light italic bg-white/40 p-3 rounded-xl border border-white/50 shadow-sm min-h-[60px]">
                  “{app.applicant_bio || '申请人未提供具体自述文字。'}”
                </p>
                <div className="flex gap-2">
                  <span className="text-[9px] px-2 py-1 bg-white border border-outline-variant rounded-lg font-bold text-on-surface-variant uppercase tracking-widest">
                    {app.housing_type}
                  </span>
                  <span className="text-[9px] px-2 py-1 bg-white border border-outline-variant rounded-lg font-bold text-on-surface-variant uppercase tracking-widest">
                    {app.experience_level}经验
                  </span>
                </div>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-4">
                {app.status === 'reviewing' ? (
                  <>
                    <button
                      onClick={() => handleStatusChange(app.id, 'approved')}
                      className="w-full py-4 bg-accent text-white rounded-2xl font-headline font-bold text-xs uppercase tracking-widest business-shadow hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group/btn"
                    >
                      <CheckCircle size={20} className="group-hover:scale-110 transition-all" />
                      批准加入
                    </button>
                    <button
                      onClick={() => handleStatusChange(app.id, 'rejected')}
                      className="w-full py-4 bg-white border border-outline-variant text-error rounded-2xl font-headline font-bold text-xs uppercase tracking-widest hover:bg-error/5 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                      <XCircle size={20} />
                      婉言拒绝
                    </button>
                  </>
                ) : (
                  <div
                    className={cn(
                      'w-full py-6 rounded-2xl flex flex-col items-center justify-center gap-2 border text-center business-shadow shadow-sm',
                      app.status === 'approved' ? 'bg-accent/5 border-accent text-accent' : 'bg-error/5 border-error text-error'
                    )}
                  >
                    {app.status === 'approved' ? (
                      <>
                        <CheckCircle size={32} strokeWidth={2.5} />
                        <span className="font-headline font-bold text-[10px] uppercase tracking-widest">领养申请已获批准</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={32} strokeWidth={2.5} />
                        <span className="font-headline font-bold text-[10px] uppercase tracking-widest">已拒绝该申请</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
