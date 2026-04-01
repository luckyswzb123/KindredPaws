import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  SquarePen,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { adminApi } from '../lib/api';
import { cn } from '../lib/utils';

type UserRecord = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  location?: string;
  phone?: string;
  is_admin: boolean;
  created_at?: string;
  updated_at?: string;
};

type UserFormState = {
  id?: string;
  name: string;
  email: string;
  password: string;
  avatar_url: string;
  location: string;
  phone: string;
  is_admin: boolean;
};

const emptyForm: UserFormState = {
  name: '',
  email: '',
  password: '',
  avatar_url: '',
  location: '',
  phone: '',
  is_admin: false,
};

const TableHeader = ({ children }: any) => (
  <th className="px-6 py-4 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant">
    {children}
  </th>
);

const Badge = ({ children, variant = 'default' }: any) => {
  const variants: Record<string, string> = {
    default: 'bg-surface-container text-on-surface-variant border-outline-variant',
    success: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm',
        variants[variant]
      )}
    >
      {children}
    </span>
  );
};

function getErrorMessage(error: any) {
  const status = error?.response?.status;
  const apiMessage = error?.response?.data?.error;

  if (status === 403) {
    return '当前账号已登录，但没有管理员权限。请先在 Supabase 的 user_profiles 表中把 is_admin 设为 true。';
  }

  if (status === 401) {
    return '登录状态已失效，请重新登录后台。';
  }

  return apiMessage || error?.message || '加载用户列表失败，请稍后重试。';
}

function buildAvatar(user: Partial<UserRecord>) {
  return (
    user.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || user.email || user.id || 'user')}`
  );
}

export default function Users() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<UserFormState>(emptyForm);

  useEffect(() => {
    void fetchUsers();
  }, []);

  async function fetchUsers() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await adminApi.getUsers();
      if (res.data.success) {
        setUsers(res.data.data || []);
      } else {
        setUsers([]);
        setErrorMessage(res.data.error || '加载用户列表失败。');
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    if (!term) {
      return users;
    }

    return users.filter((user) =>
      [user.name, user.email, user.location, user.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [keyword, users]);

  function openCreateModal() {
    setFormData(emptyForm);
    setFormError('');
    setIsModalOpen(true);
  }

  function openEditModal(user: UserRecord) {
    setFormData({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      password: '',
      avatar_url: user.avatar_url || '',
      location: user.location || '',
      phone: user.phone || '',
      is_admin: Boolean(user.is_admin),
    });
    setFormError('');
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }
    setIsModalOpen(false);
    setFormError('');
    setFormData(emptyForm);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError('');

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      setFormError('姓名和邮箱不能为空。');
      return;
    }

    if (!formData.id && formData.password.length < 6) {
      setFormError('新增用户时，密码至少需要 6 位。');
      return;
    }

    if (formData.id && formData.password && formData.password.length < 6) {
      setFormError('如果要重置密码，新密码至少需要 6 位。');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: trimmedName,
      email: trimmedEmail,
      password: formData.password,
      avatar_url: formData.avatar_url.trim(),
      location: formData.location.trim(),
      phone: formData.phone.trim(),
      is_admin: formData.is_admin,
    };

    try {
      const res = formData.id
        ? await adminApi.updateUser(formData.id, payload)
        : await adminApi.createUser(payload);

      if (!res.data.success) {
        setFormError(res.data.error || '保存用户失败。');
        return;
      }

      const savedUser = res.data.data as UserRecord;
      setUsers((current) => {
        if (formData.id) {
          return current.map((item) => (item.id === savedUser.id ? savedUser : item));
        }
        return [savedUser, ...current];
      });
      closeModal();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleAdmin(user: UserRecord) {
    setActiveUserId(user.id);
    try {
      const res = await adminApi.updateUserAdmin(user.id, !user.is_admin);
      if (res.data.success) {
        setUsers((current) => current.map((item) => (item.id === user.id ? res.data.data : item)));
      } else {
        alert(res.data.error || '更新用户权限失败');
      }
    } catch (error: any) {
      alert(getErrorMessage(error));
    } finally {
      setActiveUserId(null);
    }
  }

  async function handleDelete(user: UserRecord) {
    const confirmed = window.confirm(`确定删除用户 ${user.name || user.email} 吗？此操作会同时删除其认证账号。`);
    if (!confirmed) {
      return;
    }

    setActiveUserId(user.id);
    try {
      const res = await adminApi.deleteUser(user.id);
      if (res.data.success) {
        setUsers((current) => current.filter((item) => item.id !== user.id));
      } else {
        alert(res.data.error || '删除用户失败');
      }
    } catch (error: any) {
      alert(getErrorMessage(error));
    } finally {
      setActiveUserId(null);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight">用户管理</h1>
          <p className="text-on-surface-variant text-base font-light font-sans italic opacity-80">
            查看注册用户，新增后台账号，并直接维护用户资料与管理员权限。
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-2 gap-4 min-w-[280px]">
            <div className="bg-white rounded-2xl business-shadow border border-outline-variant px-6 py-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">注册用户</div>
              <div className="text-3xl font-headline font-bold text-on-surface">{users.length}</div>
            </div>
            <div className="bg-white rounded-2xl business-shadow border border-outline-variant px-6 py-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">管理员</div>
              <div className="text-3xl font-headline font-bold text-on-surface">
                {users.filter((user) => user.is_admin).length}
              </div>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-4 bg-accent text-white rounded-xl font-headline font-bold text-xs uppercase tracking-widest business-shadow hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
          >
            <Plus size={18} />
            新增用户
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl business-shadow border border-outline-variant overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex gap-4 items-center">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={20} />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索姓名、邮箱、地区或手机号..."
              className="w-full pl-12 pr-6 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all font-sans"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-surface-container-low">
              <tr>
                <TableHeader>用户</TableHeader>
                <TableHeader>联系信息</TableHeader>
                <TableHeader>地区</TableHeader>
                <TableHeader>角色</TableHeader>
                <TableHeader>注册时间</TableHeader>
                <TableHeader>操作</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
                    <span className="text-on-surface-variant font-light text-sm italic tracking-widest uppercase">数据加载中...</span>
                  </td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16">
                    <div className="max-w-2xl mx-auto rounded-2xl border border-amber-200 bg-amber-50 px-6 py-6 text-amber-900">
                      <div className="flex items-start gap-4">
                        <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                        <div className="space-y-2">
                          <div className="font-headline font-bold uppercase tracking-widest text-xs">用户数据暂时不可用</div>
                          <p className="text-sm leading-6">{errorMessage}</p>
                          <button
                            onClick={() => void fetchUsers()}
                            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold uppercase tracking-widest hover:bg-amber-100 transition-all"
                          >
                            重试加载
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="text-on-surface-variant/40 italic font-light">暂无匹配用户</div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-background/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <img
                          src={buildAvatar(user)}
                          alt={user.name || user.email}
                          className="w-12 h-12 rounded-2xl object-cover border border-outline-variant bg-surface-container"
                        />
                        <div className="min-w-0">
                          <div className="font-headline font-bold text-base text-on-surface truncate">
                            {user.name || '未命名用户'}
                          </div>
                          <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1 font-mono truncate">
                            {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-2 text-sm text-on-surface-variant">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="shrink-0 opacity-60" />
                          <span>{user.email || '未填写邮箱'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="shrink-0 opacity-60" />
                          <span>{user.phone || '未填写手机号'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <MapPin size={14} className="shrink-0 opacity-60" />
                        <span>{user.location || '未填写地区'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant={user.is_admin ? 'success' : 'default'}>
                        {user.is_admin ? '管理员' : '普通用户'}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">
                      {user.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '未知'}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-outline-variant bg-white text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-all"
                        >
                          <SquarePen size={14} />
                          编辑
                        </button>
                        <button
                          onClick={() => void toggleAdmin(user)}
                          disabled={activeUserId === user.id}
                          className={cn(
                            'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border',
                            user.is_admin
                              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'border-accent/20 bg-accent/5 text-accent hover:bg-accent hover:text-white',
                            activeUserId === user.id && 'opacity-60 cursor-not-allowed'
                          )}
                        >
                          {activeUserId === user.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : user.is_admin ? (
                            <Shield size={14} />
                          ) : (
                            <ShieldCheck size={14} />
                          )}
                          {user.is_admin ? '取消管理员' : '设为管理员'}
                        </button>
                        <button
                          onClick={() => void handleDelete(user)}
                          disabled={activeUserId === user.id}
                          className={cn(
                            'inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-all',
                            activeUserId === user.id && 'opacity-60 cursor-not-allowed'
                          )}
                        >
                          {activeUserId === user.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-outline-variant flex flex-col"
            >
              <div className="p-8 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                <div>
                  <h2 className="text-2xl font-headline font-bold text-on-surface tracking-tight">
                    {formData.id ? '编辑用户资料' : '新增用户'}
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-2">
                    {formData.id ? '更新用户信息、邮箱、管理员权限和可选密码。' : '创建新的登录账号，并同步写入用户资料表。'}
                  </p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-surface-container rounded-xl transition-all">
                  <X size={24} className="text-on-surface-variant" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-2 gap-8 font-sans">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] px-1">姓名</label>
                    <input
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                      placeholder="例如：张三"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] px-1">邮箱</label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                      placeholder="name@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] px-1">
                      {formData.id ? '新密码（可留空）' : '初始密码'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                      placeholder={formData.id ? '留空则不修改' : '至少 6 位'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] px-1">手机号</label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                      placeholder="例如：13800000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] px-1">地区</label>
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                      placeholder="例如：上海 / 浦东新区"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] px-1">头像 URL</label>
                    <input
                      name="avatar_url"
                      value={formData.avatar_url}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-outline-variant overflow-hidden flex items-center justify-center">
                      {formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="avatar preview" className="w-full h-full object-cover" />
                      ) : (
                        <UserRound size={24} className="text-on-surface-variant/50" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-on-surface">管理员权限</div>
                      <div className="text-xs text-on-surface-variant">勾选后，该账号可以访问后台管理全部接口。</div>
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-3 text-sm font-medium text-on-surface cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_admin"
                      checked={formData.is_admin}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded-lg border-outline-variant text-accent focus:ring-accent/20 cursor-pointer"
                    />
                    设为管理员
                  </label>
                </div>

                {formError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                    {formError}
                  </div>
                ) : null}

                <div className="p-8 border-t border-outline-variant bg-surface-container-lowest flex gap-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-4 border border-outline-variant text-on-surface-variant rounded-xl font-headline font-bold text-xs uppercase tracking-widest hover:bg-surface-container transition-all"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-accent text-white rounded-xl font-headline font-bold text-xs uppercase tracking-widest business-shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        {formData.id ? <SquarePen size={18} /> : <Plus size={18} />}
                        {formData.id ? '确认修改' : '创建用户'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
