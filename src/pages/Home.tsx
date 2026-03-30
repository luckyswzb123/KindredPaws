import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, MapPin, Heart, PawPrint, X, Home as HomeIcon, FileText, Settings, Info, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { petsApi } from '../lib/api';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleFavorite, isFavorite, favorites } = useFavorites();
  const { user, logout } = useAuth();
  const [activeCategory, setActiveCategory] = useState('全部');
  const [selectedCity, setSelectedCity] = useState('上海');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [allPets, setAllPets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isFavoritesPage = location.pathname === '/favorites';

  useEffect(() => {
    petsApi.list().then(res => {
      if (res.success) {
        setAllPets(res.data.pets || []);
      }
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const categories = ['全部', '狗狗', '猫咪', '兔子', '其他'];
  const cities = ['上海', '北京', '广州', '深圳', '杭州'];

  const filteredPets = allPets.filter(pet => {
    const matchesFavorites = !isFavoritesPage || favorites.includes(pet.id);
    const matchesCategory = activeCategory === '全部' 
      ? true 
      : activeCategory === '其他' 
        ? !['狗狗', '猫咪', '兔子'].includes(pet.category || '') 
        : (pet.category === activeCategory);
    return matchesFavorites && matchesCategory;
  });

  const handleToggleFavorite = async (e: React.MouseEvent, petId: string) => {
    e.stopPropagation();
    await toggleFavorite(petId);
  };

  const menuItems = [
    { icon: <HomeIcon size={20} />, label: '首页', path: '/home' },
    { icon: <Heart size={20} />, label: '我的收藏', path: '/favorites' },
    { icon: <FileText size={20} />, label: '领养申请', path: '/applications' },
    { icon: <Info size={20} />, label: '关于我们', path: '/about' },
    { icon: <Settings size={20} />, label: '设置', path: '/settings' },
  ];

  return (
    <div className="bg-background min-h-screen pb-32">
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            {/* Sidebar */}
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[300px] bg-white z-[101] shadow-2xl flex flex-col border-r border-outline-variant"
            >
              <div className="p-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-16">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white business-shadow">
                      <PawPrint size={24} />
                    </div>
                    <span className="font-headline font-bold text-on-surface text-2xl tracking-tight uppercase tracking-widest">萌爪家园</span>
                  </div>
                  <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 hover:bg-surface-container rounded-xl transition-colors active:scale-95"
                  >
                    <X size={24} className="text-on-surface-variant" />
                  </button>
                </div>

                <nav className="space-y-3 flex-grow">
                  {menuItems.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (item.path) navigate(item.path);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-5 p-4 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-accent transition-all group active:scale-[0.98]"
                    >
                      <div className="text-on-surface-variant group-hover:text-accent transition-colors">
                        {item.icon}
                      </div>
                      <span className="font-headline font-bold text-sm uppercase tracking-widest">{item.label}</span>
                    </button>
                  ))}
                </nav>

                <div className="pt-10 border-t border-outline-variant">
                  <button 
                    onClick={async () => {
                      if (confirm('确定要退出登录吗？')) {
                        await logout();
                        navigate('/welcome');
                      }
                    }}
                    className="w-full flex items-center gap-5 p-4 rounded-xl text-error hover:bg-error/5 transition-all active:scale-[0.98] group"
                  >
                    <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-headline font-bold text-sm uppercase tracking-widest">退出登录</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant business-shadow">
        <div className="flex items-center justify-between px-6 h-20 w-full max-w-screen-xl mx-auto">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="text-on-surface hover:bg-surface-container p-2.5 rounded-xl transition-all active:scale-95"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-white business-shadow">
              {isFavoritesPage ? <Heart size={20} fill="currentColor" /> : <PawPrint size={20} />}
            </div>
            <span className="font-headline font-bold text-on-surface text-xl tracking-tight uppercase tracking-widest">
              {isFavoritesPage ? '我的收藏' : '萌爪家园'}
            </span>
          </div>

          <div 
            onClick={() => navigate('/profile')}
            className="w-11 h-11 rounded-xl overflow-hidden border border-outline-variant cursor-pointer active:scale-95 transition-all business-shadow hover:ring-2 hover:ring-accent/20"
          >
            <img 
              alt="User" 
              className="w-full h-full object-cover" 
              src={user?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuDskq6dmsFEJ_A4Un3nEULgU7PERsdrE48GjJhQ9xZIJwK3upPr31hsihL-dXWQcK3SzHVgOby5I57Ssrt2BCsOmT3-Rzi8HvHIqGgZQR_oomNIRF4FAJW0DAl6WNYRmnT59IS-ZgesBy-AnQMTQ_58DNLR__oMuRyzkeQ_uGL3DrwLQvReQMZI5bhwumSzjwtYlorbUhdIcv6ZEcetnfI-kfRXXgjh_zEEP4uIRCHNEP6FUmjA0H7HPLI_QLf7D8ENXIlDgLN1vKSY"}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      <main className="pt-28 px-6 max-w-screen-md mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
              <MapPin size={18} className="text-accent" />
            </div>
            <select 
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent border-none font-headline font-bold text-on-surface focus:ring-0 p-0 cursor-pointer text-lg tracking-tight"
            >
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">当前定位</span>
        </div>

        <div className="mb-10">
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="text-on-surface-variant/40" size={20} />
            </div>
            <input 
              className="w-full h-14 pl-14 pr-6 bg-surface-container-low border border-outline-variant focus:border-accent focus:ring-2 focus:ring-accent/20 rounded-xl text-on-surface placeholder:text-on-surface-variant/40 business-shadow transition-all outline-none font-medium text-sm" 
              placeholder="搜索品种、城市或领养需求" 
              type="text"
            />
          </div>
        </div>

        <div className="mb-12 overflow-x-auto no-scrollbar flex gap-3 -mx-6 px-6">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "flex-none px-5 py-2 rounded-xl font-headline font-bold text-[11px] uppercase tracking-[0.1em] transition-all active:scale-[0.98]",
                activeCategory === cat 
                  ? "bg-accent text-white business-shadow ring-4 ring-accent/10"
                  : "bg-white text-on-surface-variant border border-outline-variant hover:border-accent/50 hover:bg-surface-container-low"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {filteredPets.map((pet, idx) => (
            <motion.article 
              key={pet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => navigate(`/pet/${pet.id}`)}
              className="bg-white rounded-2xl overflow-hidden group cursor-pointer business-shadow border border-outline-variant hover:ring-4 hover:ring-accent/5 transition-all"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img 
                  alt={pet.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  src={pet.image_url || pet.image}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {pet.status !== 'none' && (
                    <span className={cn(
                      "backdrop-blur-xl text-white px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] shadow-lg w-fit border border-white/20",
                      pet.status === 'new' ? "bg-accent/80" : "bg-error/80"
                    )}>
                      {pet.status === 'new' ? '新发布' : '急寻领养'}
                    </span>
                  )}
                  <span className={cn(
                    "backdrop-blur-xl text-white px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] shadow-lg w-fit border border-white/20",
                    pet.type === 'foster' ? "bg-primary/70" : "bg-on-surface-variant/70"
                  )}>
                    {pet.type === 'foster' ? '个人寄养' : '救助站'}
                  </span>
                </div>
                <button 
                  onClick={(e) => handleToggleFavorite(e, pet.id)}
                  className={cn(
                    "absolute top-3 right-3 w-9 h-9 backdrop-blur-xl rounded-xl flex items-center justify-center transition-all active:scale-125 border border-white/20 shadow-lg",
                    isFavorite(pet.id) 
                      ? "bg-error text-white" 
                      : "bg-white/40 text-white hover:bg-white/60"
                  )}
                >
                  <Heart size={18} fill={isFavorite(pet.id) ? "currentColor" : "none"} />
                </button>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <h3 className="font-headline font-bold text-lg text-on-surface leading-tight tracking-tight">{pet.name}</h3>
                    <p className="font-label text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{pet.breed} • {pet.age}</p>
                    <div className="flex items-center gap-1.5 pt-1.5 text-accent font-bold text-[10px] uppercase tracking-[0.15em]">
                      <MapPin size={12} />
                      {pet.distance}
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  );
}
