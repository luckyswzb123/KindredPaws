import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, X, Upload, Loader2, Check, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { adminApi } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const TableHeader = ({ children }: any) => (
  <th className="px-6 py-4 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant">
    {children}
  </th>
);

const Badge = ({ children, variant = 'default' }: any) => {
  const variants: any = {
    default: "bg-surface-container text-on-surface-variant border-outline-variant",
    success: "bg-green-100 text-green-800 border-green-200",
    error: "bg-red-100 text-red-800 border-red-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200"
  };
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm",
      variants[variant]
    )}>
      {children}
    </span>
  );
};

export default function Pets() {
  const [pets, setPets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    category: '狗狗',
    location: '上海',
    description: '',
    status: 'new',
    type: 'adoption',
    healthStatus: {
      vaccination: true,
      neutered: false,
      microchipped: false
    }
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getPets();
      if (res.data.success) {
        setPets(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch pets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('health.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        healthStatus: { ...prev.healthStatus, [key]: checked }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePetStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'none' ? 'new' : 'none';
    try {
      const res = await adminApi.togglePetStatus(id, newStatus);
      if (!res.data.success) {
        alert(res.data.error || '操作失败');
        return;
      }
      fetchPets();
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || '操作失败');
    }
  };

  const deletePet = async (id: string) => {
    if (!window.confirm('确定要从数据库中彻底删除这只宠物吗？此操作不可逆。')) return;
    try {
      await adminApi.deletePet(id);
      fetchPets();
    } catch (err) {
      alert('删除失败');
    }
  };

  const editPet = (pet: any) => {
    setFormData({
      id: pet.id,
      name: pet.name,
      breed: pet.breed,
      age: pet.age,
      category: pet.category,
      location: pet.location,
      description: pet.description,
      status: pet.status,
      type: pet.type,
      healthStatus: {
        vaccination: pet.vaccination,
        neutered: pet.neutered,
        microchipped: pet.microchipped
      }
    } as any);
    setImagePreview(pet.image_url);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      breed: '',
      age: '',
      category: '狗狗',
      location: '上海',
      description: '',
      status: 'new',
      type: 'adoption',
      healthStatus: {
        vaccination: true,
        neutered: false,
        microchipped: false
      }
    });
    setImageFile(null);
    setImagePreview(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let imageUrl = imagePreview;

      if (imageFile) {
        const uploadRes = await adminApi.uploadImage(imageFile);
        imageUrl = uploadRes.data.data.url;
      }

      if (!imageUrl) return alert('请上传照片');

      if ((formData as any).id) {
        await adminApi.updatePet((formData as any).id, { ...formData, image_url: imageUrl });
      } else {
        await adminApi.createPet({ ...formData, image_url: imageUrl });
      }

      setIsModalOpen(false);
      resetForm();
      fetchPets();
    } catch (error: any) {
      console.error('Submission failed:', error);
      const errorMsg = error.response?.data?.error || error.message || '未知错误';
      alert(`保存失败: ${errorMsg}\n请检查后端日志了解详细原因。`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight">宠物库管理</h1>
          <p className="text-on-surface-variant text-base font-light font-sans italic opacity-80">在此管理所有录入系统的宠物信息及其在 App 端的上下线状态。</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="px-8 py-4 bg-accent text-white rounded-xl font-headline font-bold text-xs uppercase tracking-widest business-shadow hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
        >
          <Plus size={18} />
          录入新成员
        </button>
      </header>

      <div className="bg-white rounded-2xl business-shadow border border-outline-variant overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex gap-4 items-center">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={20} />
            <input 
              type="text" 
              placeholder="搜索品种、姓名或位置..." 
              className="w-full pl-12 pr-6 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all font-sans"
            />
          </div>
          <button className="px-4 py-3 border border-outline-variant rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-all">
            <Filter size={18} />
            全部筛选
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-surface-container-low">
              <tr>
                <TableHeader>宠物图</TableHeader>
                <TableHeader>姓名/品种/年龄</TableHeader>
                <TableHeader>所在地</TableHeader>
                <TableHeader>App 状态</TableHeader>
                <TableHeader>分类</TableHeader>
                <TableHeader>管理操作</TableHeader>
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
              ) : pets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="text-on-surface-variant/40 italic font-light">暂无数据</div>
                  </td>
                </tr>
              ) : (
                pets.map((pet) => (
                  <tr key={pet.id} className="hover:bg-background/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-20 h-14 bg-surface-container rounded-xl business-shadow border border-outline-variant overflow-hidden p-0.5">
                        <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover rounded-[10px]" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-headline font-bold text-base text-on-surface tracking-tight">{pet.name}</span>
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1 font-sans opacity-60">{pet.breed} • {pet.age}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-on-surface-variant font-sans">{pet.location}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={pet.status === 'none' ? 'default' : pet.status === 'urgent' ? 'error' : 'success'}>
                        {pet.status === 'none' ? '已下线' : pet.status === 'urgent' ? '急寻领养' : '展示中'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest opacity-60">{pet.category}</span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                         <button 
                            onClick={() => togglePetStatus(pet.id, pet.status)}
                            title={pet.status === 'none' ? '恢复上线' : '从 App 下线'}
                            className="p-2.5 bg-white border border-outline-variant rounded-xl hover:bg-surface-container text-on-surface-variant transition-all hover:text-accent shadow-sm"
                         >
                           {pet.status === 'none' ? <Eye size={18} /> : <EyeOff size={18} />}
                         </button>
                         <button 
                            onClick={() => editPet(pet)}
                            title="详细修改"
                            className="p-2.5 bg-white border border-outline-variant rounded-xl hover:bg-surface-container text-on-surface-variant transition-all hover:text-accent shadow-sm"
                         >
                           <Edit2 size={18} />
                         </button>
                         <button 
                            onClick={() => deletePet(pet.id)}
                            title="彻底删除"
                            className="p-2.5 bg-white border border-outline-variant rounded-xl hover:bg-error/5 text-error transition-all shadow-sm"
                         >
                           <Trash2 size={18} />
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
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-outline-variant flex flex-col"
            >
              <div className="p-8 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                 <h2 className="text-2xl font-headline font-bold text-on-surface tracking-tight">{(formData as any).id ? '修改宠物档案' : '录入宠物新成员'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-container rounded-xl transition-all">
                   <X size={24} className="text-on-surface-variant" />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                {/* Image Upload Area */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] block">宠物照片库</label>
                  <div 
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className={cn(
                      "w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group business-shadow border-outline-variant",
                      imagePreview ? "border-accent bg-accent/5" : "border-outline-variant hover:border-accent hover:bg-accent/5"
                    )}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-on-surface-variant group-hover:text-accent group-hover:scale-110 transition-all">
                        <Upload size={40} strokeWidth={1.5} />
                        <div className="text-center">
                           <p className="font-bold text-sm tracking-widest uppercase">点击或拖拽上传</p>
                           <p className="text-[10px] font-sans font-medium mt-1">支持 JPG, PNG (高清大图将自动处理)</p>
                        </div>
                      </div>
                    )}
                    <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 font-sans">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] px-1">宠物姓名</label>
                    <input 
                      required name="name" value={formData.name} onChange={handleInputChange}
                      className="w-full px-5 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" 
                      placeholder="例: 米高(Migo)" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] px-1">宠物品种</label>
                    <input 
                      required name="breed" value={formData.breed} onChange={handleInputChange}
                      className="w-full px-5 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" 
                      placeholder="例: 英国短毛猫" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] px-1">年龄段/描述</label>
                    <input 
                      required name="age" value={formData.age} onChange={handleInputChange}
                      className="w-full px-5 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" 
                      placeholder="例: 3个月 / 2岁" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] px-1">所属分类</label>
                    <select 
                      name="category" value={formData.category} onChange={handleInputChange}
                      className="w-full px-5 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none appearance-none font-bold"
                    >
                      <option>狗狗</option>
                      <option>猫咪</option>
                      <option>兔子</option>
                      <option>其他</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 font-sans">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] px-1">所在地信息</label>
                    <input 
                      required name="location" value={formData.location} onChange={handleInputChange}
                      className="w-full px-5 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" 
                      placeholder="例: 上海, 浦东新区" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] px-1">展示状态</label>
                    <select 
                      name="status" value={formData.status} onChange={handleInputChange}
                      className="w-full px-5 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none appearance-none font-bold"
                    >
                      <option value="new">新发布 (展示中)</option>
                      <option value="urgent">急寻领养 (高亮展示)</option>
                      <option value="none">已下线 (App 端不可见)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 font-sans">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] px-1">详细描述 / 它的故事</label>
                  <textarea 
                    name="description" value={formData.description} onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none min-h-[120px] resize-none" 
                    placeholder="分享它的性格、喜好，让新主人更了解它..." 
                  />
                </div>

                <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant space-y-4 font-sans">
                   <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">健康状态勾选</p>
                   <div className="flex gap-8">
                     {[
                       { label: '已接种疫苗', key: 'vaccination' },
                       { label: '已绝育', key: 'neutered' },
                       { label: '有芯片', key: 'microchipped' }
                     ].map(item => (
                       <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                         <input 
                            type="checkbox" name={`health.${item.key}`} 
                            checked={(formData.healthStatus as any)[item.key]}
                            onChange={handleInputChange}
                            className="w-5 h-5 rounded-lg border-outline-variant text-accent focus:ring-accent/20 cursor-pointer" 
                          />
                         <span className="text-sm font-medium text-on-surface group-hover:text-accent transition-colors">{item.label}</span>
                       </label>
                     ))}
                   </div>
                </div>

                <div className="p-8 border-t border-outline-variant bg-surface-container-lowest flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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
                        <Check size={18} />
                        {(formData as any).id ? '确认修改' : '确认并发布'}
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
