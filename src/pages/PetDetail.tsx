import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MapPin, ShieldCheck as Health, CheckCircle2, MessageCircle, Info, ChevronRight } from 'lucide-react';
import { MOCK_PETS } from '../constants';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useFavorites } from '../context/FavoritesContext';

import { petsApi } from '../lib/api';

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [pet, setPet] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    setLoading(true);
    petsApi.get(id)
      .then(res => {
        if (res.success) {
          setPet(res.data);
        } else {
          // Fallback to mock if API fails for some reason or pet not found
          const mock = MOCK_PETS.find(p => p.id === id) || MOCK_PETS[0];
          setPet(mock);
        }
      })
      .catch(() => {
        const mock = MOCK_PETS.find(p => p.id === id) || MOCK_PETS[0];
        setPet(mock);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pet) return null;

  const handleToggleFavorite = () => {
    toggleFavorite(pet.id);
    if (!isFavorite(pet.id)) {
      alert('已加入收藏');
    } else {
      alert('已取消收藏');
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 border-b border-outline-variant business-shadow">
        <button 
          onClick={() => navigate(-1)}
          className="hover:bg-surface-container rounded-xl transition-colors p-2 active:scale-95"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="text-on-surface font-headline font-bold text-xl tracking-tight uppercase tracking-widest">萌爪家园</span>
        <button 
          onClick={handleToggleFavorite}
          className={cn(
            "hover:bg-surface-container rounded-xl transition-colors p-2 active:scale-110",
            isFavorite(pet.id) ? "text-error" : "text-on-surface-variant"
          )}
        >
          <Heart size={24} fill={isFavorite(pet.id) ? "currentColor" : "none"} />
        </button>
      </header>

      <main className="pt-16">
        <section className="relative w-full h-[530px] overflow-hidden">
          <img 
            className="w-full h-full object-cover" 
            src={pet.image}
            alt={pet.name}
            referrerPolicy="no-referrer"
          />
          
          <div className="absolute bottom-8 left-6 right-6 p-8 rounded-2xl bg-white/90 backdrop-blur-xl business-shadow-lg border border-white/20">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="font-headline font-bold text-4xl text-on-surface tracking-tight mb-2">{pet.name}</h1>
                <div className="flex items-center gap-2 text-accent font-bold">
                  <MapPin size={14} />
                  <span className="text-[10px] uppercase tracking-[0.2em]">{pet.location}</span>
                </div>
              </div>
              <div className="flex -space-x-2">
                {pet.type === 'foster' ? (
                  <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/40 business-shadow">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-white">
                      <img 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDskq6dmsFEJ_A4Un3nEULgU7PERsdrE48GjJhQ9xZIJwK3upPr31hsihL-dXWQcK3SzHVgOby5I57Ssrt2BCsOmT3-Rzi8HvHIqGgZQR_oomNIRF4FAJW0DAl6WNYRmnT59IS-ZgesBy-AnQMTQ_58DNLR__oMuRyzkeQ_uGL3DrwLQvReQMZI5bhwumSzjwtYlorbUhdIcv6ZEcetnfI-kfRXXgjh_zEEP4uIRCHNEP6FUmjA0H7HPLI_QLf7D8ENXIlDgLN1vKSY" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-on-surface uppercase tracking-widest">{pet.fostererName || '个人寄养'}</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl border-2 border-white overflow-hidden business-shadow">
                      <img 
                        className="w-full h-full object-cover" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2385CSPGB66rPicbUnEb5ELXoRQMEndUIhGsr3xp5cK0Ku37xJ-AEn0lF0_if1SzQc4BhBykvTVuyChzS0bTj4nZV6RBtDrLSIxs7__ZRm40-Ko2jS5s4NZmngrHx7sJ21yMcRPnbQjrk1LxfG_u1WrH0fzdCFpgVjCBeQVjsPY_gxEekDvSrXk8XN836IUYsOf_KMVW4nP6mv4KoQnmQbW62vRvAuWVdkxcPR2-wtIDB-SEUXrNmZZfqEfUD7R8p3IruEnTxYHu9"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="w-12 h-12 rounded-xl border-2 border-white bg-accent flex items-center justify-center text-white text-xs font-bold business-shadow">+3</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="px-6 -mt-6 relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: '年龄', value: pet.age },
            { label: '体重', value: pet.weight || '未知' },
            { label: '性别', value: pet.gender || '未知' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-xl flex flex-col items-center justify-center text-center business-shadow border border-outline-variant">
              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-1.5">{stat.label}</span>
              <span className="text-sm font-bold text-on-surface">{stat.value}</span>
            </div>
          ))}
        </div>

        <section className="px-6 mt-16 space-y-12">
          <div className="space-y-6">
            <h3 className="font-headline font-bold text-xl text-on-surface tracking-tight uppercase tracking-widest">性格特点</h3>
            <div className="flex flex-wrap gap-3">
              {pet.personality.map((trait, i) => (
                <span key={i} className="bg-surface-container text-on-surface px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-outline-variant">
                  {trait}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-headline font-bold text-xl text-on-surface tracking-tight uppercase tracking-widest">关于 {pet.name}</h3>
            <div className="prose prose-stone prose-sm max-w-none">
              <p className="text-on-surface-variant leading-relaxed text-lg font-light italic border-l-4 border-accent pl-4">
                {pet.type === 'foster' ? '“寻找一个温暖的临时港湾。”' : '“宛如化身为狗狗的金色暖阳。”'}
              </p>
              <p className="text-on-surface-variant leading-relaxed mt-6 font-light text-base">
                {pet.description}
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl space-y-6 business-shadow border border-outline-variant">
            <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-3 tracking-tight uppercase tracking-widest">
              <Health className="text-accent" size={24} />
              健康状况
            </h3>
            <div className="space-y-4">
              {[
                { label: '疫苗接种', value: pet.healthStatus.vaccination ? '已完成' : '未完成', check: pet.healthStatus.vaccination },
                { label: '绝育情况', value: pet.healthStatus.neutered ? '是' : '否' },
                { label: '芯片植入', value: pet.healthStatus.microchipped ? '是' : '否' }
              ].map((item, i) => (
                <React.Fragment key={i}>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">{item.label}</span>
                    <span className="text-on-surface font-bold text-sm flex items-center gap-2">
                      {item.value}
                      {item.check && <CheckCircle2 className="text-accent" size={18} />}
                    </span>
                  </div>
                  {i < 2 && <div className="w-full h-[1px] bg-outline-variant/30" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="space-y-6 pb-12">
            <h3 className="font-headline font-bold text-xl text-on-surface tracking-tight uppercase tracking-widest">
              {pet.type === 'foster' ? '寄养位置' : `去见见 ${pet.name}`}
            </h3>
            <div className="bg-white p-8 rounded-2xl flex items-start gap-6 business-shadow border border-outline-variant">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                <MapPin size={28} fill="currentColor" />
              </div>
              <div className="flex-grow">
                <p className="font-bold text-on-surface text-lg tracking-tight">
                  {pet.type === 'foster' ? '个人寄养家庭' : '阳光流浪动物救助站'}
                </p>
                <p className="text-on-surface-variant mt-2 text-sm font-light">
                  {pet.type === 'foster' ? pet.location : '上海市浦东新区张江路1242号'}
                </p>
                <button 
                  onClick={() => alert('正在获取路线...')}
                  className="mt-4 text-accent font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:underline"
                >
                  查看地图路线
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl z-50 border-t border-outline-variant business-shadow-lg">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button 
            onClick={() => {
              console.log('Navigating to chat...');
              navigate('/chat/m1');
            }}
            className="h-14 w-14 rounded-xl bg-surface-container text-on-surface flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-90 duration-200 cursor-pointer border border-outline-variant"
          >
            <MessageCircle size={26} />
          </button>
          <button 
            onClick={() => navigate('/apply', { state: { petId: pet.id, type: pet.type } })}
            className="flex-1 h-14 bg-accent text-white font-headline font-bold text-xs uppercase tracking-[0.2em] rounded-xl business-shadow active:scale-[0.98] transition-all"
          >
            {pet.type === 'foster' ? '立即申请寄养' : '立即申请领养'}
          </button>
        </div>
      </div>
    </div>
  );
}
