import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Bell, Edit2, ChevronRight, Flower2, PawPrint, Heart, Plus, Home, Search, User, Camera, Upload, X } from 'lucide-react';
import { MOCK_MESSAGES, MOCK_PETS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useFavorites } from '../context/FavoritesContext';
import { useApplications } from '../context/ApplicationContext';
import { useAuth } from '../context/AuthContext';
import { profileApi, petsApi } from '../lib/api';

export default function Profile() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { applications, updateApplicationStatus } = useApplications();
  const { user, refreshProfile, logout, updateUser } = useAuth();
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const fosterImageInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Initialize edit form when user loads
  const [editForm, setEditForm] = React.useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar_url || '',
    location: user?.location || '',
    email: user?.email || '',
    phone: user?.phone || '',
    experience: user?.experience || '',
    interestedIn: user?.interested_in || ''
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar_url || '',
        location: user.location || '',
        email: user.email || '',
        phone: user.phone || '',
        experience: user.experience || '',
        interestedIn: user.interested_in || ''
      });
    }
  }, [user]);

  const [isPostingFoster, setIsPostingFoster] = React.useState(false);
  const [fosterForm, setFosterForm] = React.useState({
    name: '',
    breed: '',
    age: '',
    description: '',
    category: '其他',
    location: user?.location || '上海',
    image: ''
  });

  const handlePostFoster = async () => {
    if (!fosterForm.name || !fosterForm.breed || !fosterForm.image) {
      alert('请填齐宠物姓名、品种并上传照片');
      return;
    }
    setIsSaving(true);
    try {
      await petsApi.create({
        name: fosterForm.name,
        breed: fosterForm.breed,
        age: fosterForm.age,
        description: fosterForm.description,
        category: fosterForm.category,
        location: fosterForm.location,
        image_url: fosterForm.image
      });
      alert('寄养信息已成功发布！');
      setIsPostingFoster(false);
      setFosterForm({ name: '', breed: '', age: '', description: '', category: '其他', location: user?.location || '上海', image: '' });
    } catch (err: any) {
      alert(err.message || '发布失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await profileApi.update({
        name: editForm.name,
        bio: editForm.bio,
        location: editForm.location,
        phone: editForm.phone,
        experience: editForm.experience,
        interested_in: editForm.interestedIn
      });

      if (res.success) {
        updateUser({
          name: editForm.name,
          bio: editForm.bio,
          location: editForm.location,
          phone: editForm.phone,
          experience: editForm.experience,
          interested_in: editForm.interestedIn,
          avatar_url: editForm.avatar
        });
        alert('个人资料已成功更新！');
        setIsEditing(false);
      }
    } catch (err: any) {
      alert(err.message || '更新失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'foster') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        if (type === 'avatar') {
          setEditForm({ ...editForm, avatar: base64String });
          try {
            await profileApi.uploadAvatar(base64String, file.name);
            refreshProfile(); // Refresh context to get new remote URL
          } catch(err) {
            console.error('Upload failed:', err);
          }
        } else {
          setFosterForm({ ...fosterForm, image: base64String });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return <div className="p-8 text-center text-on-surface-variant text-sm">加载中...</div>;

  return (
    <div className="bg-background min-h-screen pb-32">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-primary font-headline font-bold text-lg tracking-tight">个人中心</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/messages')}
            className="hover:bg-surface-container rounded-lg transition-colors p-2 active:scale-95 relative"
          >
            <Bell size={20} className="text-on-surface-variant" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-error rounded-full border border-background" />
          </button>
          <button 
            onClick={() => {
              setEditForm({ ...user });
              setIsEditing(true);
            }}
            className="p-2 hover:bg-surface-container rounded-lg transition-colors active:scale-95"
          >
            <Edit2 size={20} className="text-on-surface-variant" />
          </button>
        </div>
      </nav>

      <main className="pt-20 px-6 max-w-5xl mx-auto space-y-10">
        <section className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-48 flex-shrink-0">
            <div className="aspect-square rounded-2xl overflow-hidden business-shadow border border-outline-variant bg-white">
              <img 
                className="w-full h-full object-cover" 
                src={user.avatar_url}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div className="flex-grow space-y-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h1 className="font-headline font-bold text-3xl tracking-tight text-on-surface">{user.name}</h1>
                <button 
                  onClick={() => {
                    setEditForm({ ...user });
                    setIsEditing(true);
                  }}
                  className="px-5 py-2 bg-primary text-white rounded-lg font-bold text-xs business-shadow active:scale-[0.98] transition-all hover:bg-primary/90 flex items-center gap-2"
                >
                  <Edit2 size={14} />
                  编辑资料
                </button>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <MapPin size={14} className="text-accent" />
                <span className="text-xs font-medium">{user.location}</span>
              </div>
            </div>
            <p className="font-body text-on-surface-variant text-base leading-relaxed font-light max-w-2xl">{user.bio}</p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { label: '收藏', value: favorites.length.toString(), action: () => navigate('/favorites') },
                { label: '申请中', value: applications.filter(a => a.status === 'reviewing').length.toString(), action: () => document.getElementById('applications')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: '已帮助', value: '3', action: () => {} }
              ].map((stat, i) => (
                <button 
                  key={i} 
                  onClick={stat.action}
                  className="px-5 py-3 bg-white border border-outline-variant rounded-xl business-shadow flex flex-col items-start gap-0.5 min-w-[100px] hover:border-accent transition-colors group"
                >
                  <span className="font-headline font-bold text-xl text-accent group-hover:scale-110 transition-transform origin-left">{stat.value}</span>
                  <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">{stat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <section id="applications" className="space-y-6">
              <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                <h2 className="font-headline font-bold text-xl text-on-surface tracking-tight">领养申请</h2>
                <button 
                  onClick={() => navigate('/applications')}
                  className="text-primary font-label text-xs font-bold hover:underline uppercase tracking-wider"
                >
                  全部记录
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {applications.filter(app => app.type === 'adoption').map(app => (
                  <div 
                    key={app.id} 
                    className="bg-white p-4 rounded-xl business-shadow border border-outline-variant flex items-center gap-4 group cursor-pointer hover:border-accent transition-all"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-outline-variant">
                      <img className="w-full h-full object-cover" src={app.petImage} referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-headline font-bold text-on-surface truncate text-sm">{app.petName}</h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex-shrink-0",
                          app.status === 'approved' ? "bg-accent-container text-on-accent-container" : 
                          app.status === 'rejected' ? "bg-error-container text-on-error-container" :
                          "bg-surface-container text-on-surface-variant"
                        )}>
                          {app.status === 'approved' ? '已通过' : app.status === 'rejected' ? '未通过' : '审核中'}
                        </span>
                      </div>
                      <p className="font-body text-[10px] text-on-surface-variant mt-0.5 truncate">{app.petBreed} • {app.petAge}</p>
                    </div>
                  </div>
                ))}
                {applications.filter(app => app.type === 'adoption').length === 0 && (
                  <div className="col-span-full py-10 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                    <p className="text-xs text-on-surface-variant font-medium">暂无领养申请记录</p>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                <h2 className="font-headline font-bold text-xl text-on-surface tracking-tight">收到的申请</h2>
                <div className="flex items-center gap-3">
                  {applications.filter(app => app.type === 'foster' && app.status === 'reviewing').length > 0 && (
                    <span className="bg-error text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {applications.filter(app => app.type === 'foster' && app.status === 'reviewing').length} 条待处理
                    </span>
                  )}
                  <button 
                    onClick={() => navigate('/applications')}
                    className="text-primary font-label text-xs font-bold hover:underline uppercase tracking-wider"
                  >
                    全部记录
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {applications.filter(app => app.type === 'foster').map(app => (
                  <div 
                    key={app.id} 
                    className="bg-white p-5 rounded-xl border border-outline-variant business-shadow space-y-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container border border-outline-variant">
                        <img 
                          src={app.applicantAvatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDskq6dmsFEJ_A4Un3nEULgU7PERsdrE48GjJhQ9xZIJwK3upPr31hsihL-dXWQcK3SzHVgOby5I57Ssrt2BCsOmT3-Rzi8HvHIqGgZQR_oomNIRF4FAJW0DAl6WNYRmnT59IS-ZgesBy-AnQMTQ_58DNLR__oMuRyzkeQ_uGL3DrwLQvReQMZI5bhwumSzjwtYlorbUhdIcv6ZEcetnfI-kfRXXgjh_zEEP4uIRCHNEP6FUmjA0H7HPLI_QLf7D8ENXIlDgLN1vKSY"} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-sm text-on-surface">{app.applicantName} <span className="font-normal text-on-surface-variant">申请寄养</span> {app.petName}</h4>
                        <p className="text-[10px] text-on-surface-variant mt-0.5 line-clamp-1">{app.applicantBio}</p>
                      </div>
                    </div>
                    {app.status === 'reviewing' ? (
                      <div className="flex gap-3">
                        <button 
                          onClick={() => updateApplicationStatus(app.id, 'approved')}
                          className="flex-1 py-2.5 bg-accent text-white text-xs font-bold rounded-lg active:scale-[0.98] transition-all business-shadow"
                        >
                          批准申请
                        </button>
                        <button 
                          onClick={() => updateApplicationStatus(app.id, 'rejected')}
                          className="flex-1 py-2.5 bg-white border border-outline-variant text-on-surface text-xs font-bold rounded-lg active:scale-[0.98] transition-all"
                        >
                          拒绝
                        </button>
                      </div>
                    ) : (
                      <div className={cn(
                        "text-center py-2 rounded-lg text-xs font-bold",
                        app.status === 'approved' ? "bg-accent-container text-on-accent-container" : "bg-error-container text-on-error-container"
                      )}>
                        {app.status === 'approved' ? '已通过' : '已拒绝'}
                      </div>
                    )}
                  </div>
                ))}
                {applications.filter(app => app.type === 'foster').length === 0 && (
                  <div className="py-10 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                    <p className="text-xs text-on-surface-variant font-medium">暂无收到的申请</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <section className="space-y-6">
              <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                <h2 className="font-headline font-bold text-xl text-on-surface tracking-tight">发布寄养</h2>
                <button 
                  onClick={() => setIsPostingFoster(true)}
                  className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {MOCK_PETS.filter(pet => pet.type === 'foster').map(pet => (
                  <div 
                    key={pet.id} 
                    onClick={() => navigate(`/pet/${pet.id}`)}
                    className="bg-white rounded-xl overflow-hidden business-shadow border border-outline-variant group cursor-pointer hover:border-accent transition-all"
                  >
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={pet.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-on-surface">{pet.name}</h4>
                        <span className="text-[8px] font-bold text-accent bg-accent-container px-2 py-0.5 rounded uppercase tracking-wider">进行中</span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-1">{pet.breed} • {pet.age}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                <h2 className="font-headline font-bold text-xl text-on-surface tracking-tight">收藏夹</h2>
                <button onClick={() => navigate('/favorites')} className="text-primary font-label text-xs font-bold hover:underline uppercase tracking-wider">查看全部</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {MOCK_PETS.filter(pet => favorites.includes(pet.id)).slice(0, 4).map(pet => (
                  <div 
                    key={pet.id} 
                    onClick={() => navigate(`/pet/${pet.id}`)}
                    className="group relative aspect-square rounded-xl overflow-hidden business-shadow border border-outline-variant bg-white cursor-pointer"
                  >
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={pet.image} referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <p className="text-[10px] font-bold text-white truncate">{pet.name}</p>
                    </div>
                  </div>
                ))}
                {favorites.length === 0 && (
                  <div className="col-span-full py-8 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                    <p className="text-[10px] text-on-surface-variant font-medium">暂无收藏</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {isEditing && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
                onClick={() => setIsEditing(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-2xl p-8 business-shadow-lg space-y-8 max-h-[90vh] overflow-y-auto no-scrollbar border border-outline-variant"
              >
                <div className="flex justify-between items-center border-b border-outline-variant pb-4">
                  <h2 className="font-headline font-bold text-2xl text-on-surface tracking-tight">编辑个人资料</h2>
                  <button onClick={() => setIsEditing(false)} className="text-on-surface-variant hover:text-on-surface transition-colors p-2 hover:bg-surface-container rounded-xl">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="space-y-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-2xl overflow-hidden bg-surface-container business-shadow border border-outline-variant">
                        <img 
                          src={editForm.avatar} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <button 
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl"
                      >
                        <Camera size={24} className="text-white" />
                      </button>
                    </div>
                    <div className="text-center">
                      <button 
                        onClick={() => avatarInputRef.current?.click()}
                        className="text-accent font-bold text-xs hover:underline uppercase tracking-wider"
                      >
                        更换头像
                      </button>
                      <p className="text-[10px] text-on-surface-variant mt-1">支持 JPG, PNG 格式</p>
                    </div>
                    <input 
                      type="file"
                      ref={avatarInputRef}
                      onChange={(e) => handleFileChange(e, 'avatar')}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">昵称</label>
                      <input 
                        type="text" 
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">所在地</label>
                      <input 
                        type="text" 
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">电子邮箱</label>
                      <input 
                        type="email" 
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">联系电话</label>
                      <input 
                        type="text" 
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">个人简介</label>
                      <textarea 
                        rows={4}
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-4 bg-surface-container text-on-surface font-bold rounded-xl active:scale-[0.98] transition-all text-xs uppercase tracking-widest"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className={cn(
                      "flex-1 py-4 bg-accent text-white font-bold rounded-xl business-shadow active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest",
                      isSaving && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {isSaving ? '保存中...' : '保存修改'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Post Foster Modal */}
        <AnimatePresence>
          {isPostingFoster && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
                onClick={() => setIsPostingFoster(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-2xl p-8 business-shadow-lg space-y-8 max-h-[90vh] overflow-y-auto no-scrollbar border border-outline-variant"
              >
                <div className="flex justify-between items-center border-b border-outline-variant pb-4">
                  <h2 className="font-headline font-bold text-2xl text-on-surface tracking-tight">发布寄养需求</h2>
                  <button onClick={() => setIsPostingFoster(false)} className="text-on-surface-variant hover:text-on-surface transition-colors p-2 hover:bg-surface-container rounded-xl">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">宠物姓名</label>
                    <input 
                      type="text" 
                      placeholder="例如：糯米"
                      value={fosterForm.name}
                      onChange={(e) => setFosterForm({ ...fosterForm, name: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">品种</label>
                    <input 
                      type="text" 
                      placeholder="例如：萨摩耶"
                      value={fosterForm.breed}
                      onChange={(e) => setFosterForm({ ...fosterForm, breed: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">年龄</label>
                    <input 
                      type="text" 
                      placeholder="例如：2岁"
                      value={fosterForm.age}
                      onChange={(e) => setFosterForm({ ...fosterForm, age: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">宠物照片</label>
                    <div className="flex flex-col gap-4">
                      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-surface-container border border-dashed border-outline-variant flex items-center justify-center relative group">
                        {fosterForm.image ? (
                          <>
                            <img 
                              src={fosterForm.image} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                onClick={() => fosterImageInputRef.current?.click()}
                                className="px-6 py-2 bg-white text-on-surface rounded-lg text-xs font-bold flex items-center gap-2"
                              >
                                <Camera size={14} />
                                更换照片
                              </button>
                            </div>
                          </>
                        ) : (
                          <button 
                            onClick={() => fosterImageInputRef.current?.click()}
                            className="flex flex-col items-center gap-3 text-on-surface-variant hover:text-accent transition-colors"
                          >
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center business-shadow">
                              <Upload size={24} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">点击上传宠物照片</span>
                          </button>
                        )}
                      </div>
                      <input 
                        type="file"
                        ref={fosterImageInputRef}
                        onChange={(e) => handleFileChange(e, 'foster')}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">寄养说明</label>
                    <textarea 
                      rows={4}
                      placeholder="请简要说明寄养原因、时间以及对寄养人的要求..."
                      value={fosterForm.description}
                      onChange={(e) => setFosterForm({ ...fosterForm, description: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsPostingFoster(false)}
                    className="flex-1 py-4 bg-surface-container text-on-surface font-bold rounded-xl active:scale-[0.98] transition-all text-xs uppercase tracking-widest"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handlePostFoster}
                    disabled={isSaving}
                    className={cn(
                      "flex-1 py-4 bg-accent text-white font-bold rounded-xl business-shadow active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest",
                      isSaving && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {isSaving ? '发布中...' : '立即发布'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <section className="mt-12 mb-20">
          <button 
            onClick={async () => {
              if (confirm('确定要退出登录吗？')) {
                await logout();
                navigate('/welcome');
              }
            }}
            className="w-full py-4 bg-white border border-outline-variant text-error font-bold rounded-xl hover:bg-error/5 transition-all active:scale-[0.98] business-shadow uppercase tracking-widest text-[10px]"
          >
            退出当前账号
          </button>
        </section>
      </main>
    </div>
  );
}
