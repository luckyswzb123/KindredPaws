import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, HelpCircle, Home, Building2 as Apartment, History, Plus, ArrowRight, ArrowLeft, CheckCircle2, Edit2, PawPrint, User, MapPin, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { petsApi } from '../lib/api';

import { useApplications } from '../context/ApplicationContext';
import { MOCK_PETS } from '../constants';
import { useLocation } from 'react-router-dom';

export default function ApplicationForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addApplication } = useApplications();
  const petIdFromState = location.state?.petId;
  const petTypeFromState = location.state?.type;
  
  const [pet, setPet] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '艾琳娜·凡斯', 
    address: '',
    phone: '',
    wechat: '',
    bio: '动物爱好者，希望能给毛孩子一个温馨的家。',
    housingDescription: '',
  });

  React.useEffect(() => {
    if (petIdFromState) {
      // Try to find in mock first
      const mock = MOCK_PETS.find(p => p.id === petIdFromState);
      if (mock) {
        setPet(mock);
      } else {
        // Fetch from API
        petsApi.get(petIdFromState).then(res => {
          if (res.success) setPet(res.data);
          else setPet(MOCK_PETS[0]);
        }).catch(() => setPet(MOCK_PETS[0]));
      }
    } else {
      setPet(MOCK_PETS[0]);
    }
  }, [petIdFromState]);

  const [housingType, setHousingType] = useState<'owned' | 'rented'>('owned');
  const [hasOutdoorSpace, setHasOutdoorSpace] = useState(true);
  const [experience, setExperience] = useState<'new' | 'some' | 'experienced'>('experienced');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!pet) return null;

  const steps = [
    { id: 1, label: '基础信息', title: '告诉我们你是谁' },
    { id: 2, label: '生活方式', title: '介绍一下你的家庭环境' },
    { id: 3, label: '养宠经验', title: '分享你的养宠故事' },
    { id: 4, label: '审核确认', title: '最后确认申请' }
  ];

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      if (!agreedToTerms) {
        alert('请先阅读并同意领养电子协议');
        return;
      }

      if (!formData.name || !formData.phone || !formData.address) {
        alert('请填写完整的联系信息（姓名、电话、地址）');
        setCurrentStep(1);
        return;
      }
      
      setIsSubmitting(true);
      try {
        // Add the application to the context (which calls the backend)
        await addApplication({
          petName: pet.name,
          petBreed: pet.breed,
          petAge: pet.age,
          petImage: pet.image,
          type: petTypeFromState || 'adoption',
          applicantName: formData.name,
          applicantPhone: formData.phone,
          applicantAddress: formData.address,
          applicantWechat: formData.wechat,
          applicantBio: formData.bio,
          housingType,
          housingDescription: formData.housingDescription,
          hasOutdoorSpace,
          experienceLevel: experience,
          petId: pet.id
        });

        alert('申请已提交！您可以在“消息中心”查看申请状态。');
        navigate('/messages'); // Redirect to messages as requested to "display message in message center"
      } catch (err: any) {
        alert(err.message || '提交申请失败，请稍后再试');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    } else {
      navigate(-1);
    }
  };

  return (
    <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto bg-background min-h-screen">
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 border-b border-outline-variant business-shadow">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-on-surface active:scale-95 p-2 hover:bg-surface-container rounded-xl transition-colors">
            <X size={24} />
          </button>
          <span className="text-on-surface font-headline font-bold text-xl tracking-tight uppercase tracking-widest">萌爪家园</span>
        </div>
        <div className="flex gap-4">
          <button className="text-on-surface p-2 hover:bg-surface-container rounded-xl transition-colors active:scale-95">
            <HelpCircle size={24} />
          </button>
        </div>
      </nav>

      <header className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <span className="font-label text-[10px] uppercase tracking-[0.25em] text-on-surface-variant font-bold mb-1.5">领养申请流程</span>
            <h1 className="font-headline font-bold text-4xl text-on-surface tracking-tight">
              {steps.find(s => s.id === currentStep)?.title}
            </h1>
          </div>
          <div className="text-right">
            <span className="font-headline font-bold text-3xl text-accent">0{currentStep}</span>
            <span className="font-headline font-bold text-xl text-on-surface-variant/30">/04</span>
          </div>
        </div>

        <div className="relative h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
          <motion.div 
            initial={false}
            animate={{ width: `${(currentStep / 4) * 100}%` }}
            className="absolute top-0 left-0 h-full bg-accent rounded-full" 
          />
        </div>
        
        <div className="flex justify-between mt-6">
          {steps.map((step, i) => (
            <div key={i} className={cn("flex flex-col items-center", currentStep < step.id && "opacity-30")}>
              <div className={cn(
                "rounded-full mb-2.5 transition-all duration-300",
                currentStep === step.id ? "w-3.5 h-3.5 bg-accent ring-4 ring-accent/20" : 
                currentStep > step.id ? "w-2.5 h-2.5 bg-accent" : "w-2.5 h-2.5 bg-outline-variant"
              )} />
              <span className={cn("font-label text-[9px] uppercase tracking-[0.15em] font-bold", currentStep === step.id ? "text-on-surface" : "text-on-surface-variant")}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </header>

      <form className="space-y-12" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <User size={24} className="text-accent" />
                  </div>
                  <h2 className="font-headline font-bold text-2xl tracking-tight text-on-surface">个人基础信息</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">真实姓名</label>
                    <input 
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="请输入您的法定姓名"
                      className="w-full bg-surface-container-low border border-outline-variant focus:ring-2 focus:ring-accent/20 focus:border-accent rounded-xl p-4 text-on-surface transition-all text-sm font-medium outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">常住住址</label>
                    <div className="relative">
                      <MapPin size={20} className="absolute left-4 top-4 text-on-surface-variant/40" />
                      <input 
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="省、市、区、街道门牌号"
                        className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant focus:ring-2 focus:ring-accent/20 focus:border-accent rounded-xl text-on-surface transition-all text-sm font-medium outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">联系电话</label>
                    <div className="relative">
                      <Phone size={20} className="absolute left-4 top-4 text-on-surface-variant/40" />
                      <input 
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="请输入您的手机号码"
                        className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant focus:ring-2 focus:ring-accent/20 focus:border-accent rounded-xl text-on-surface transition-all text-sm font-medium outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">微信号 (可选)</label>
                    <input 
                      type="text"
                      value={formData.wechat}
                      onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
                      placeholder="方便志愿者与您取得联系"
                      className="w-full bg-surface-container-low border border-outline-variant focus:ring-2 focus:ring-accent/20 focus:border-accent rounded-xl p-4 text-on-surface transition-all text-sm font-medium outline-none"
                    />
                  </div>
                </div>
              </section>

              <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant business-shadow">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  <span className="font-bold block mb-1.5 uppercase tracking-widest text-[10px] text-on-surface">隐私保护说明：</span>
                  您的个人信息仅用于领养审核流程，我们将严格遵守隐私政策，不会向任何第三方泄露您的敏感信息。
                </p>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Home size={24} className="text-accent" />
                  </div>
                  <h2 className="font-headline font-bold text-2xl tracking-tight text-on-surface">居住环境描述</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 ml-1">居住类型</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => setHousingType('owned')}
                        className={cn(
                          "flex items-center justify-center gap-3 p-5 rounded-xl bg-white border transition-all business-shadow active:scale-[0.98]",
                          housingType === 'owned' ? "border-accent text-accent font-bold ring-2 ring-accent/10" : "border-outline-variant text-on-surface-variant hover:border-accent/50"
                        )}
                      >
                        <Home size={20} fill={housingType === 'owned' ? "currentColor" : "none"} />
                        <span className="text-sm uppercase tracking-widest">自有住房</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setHousingType('rented')}
                        className={cn(
                          "flex items-center justify-center gap-3 p-5 rounded-xl bg-white border transition-all business-shadow active:scale-[0.98]",
                          housingType === 'rented' ? "border-accent text-accent font-bold ring-2 ring-accent/10" : "border-outline-variant text-on-surface-variant hover:border-accent/50"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 border-2 rounded-md",
                          housingType === 'rented' ? "border-accent bg-accent/20" : "border-current"
                        )} />
                        <span className="text-sm uppercase tracking-widest">整租/合租</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 ml-1">描述你的生活空间</label>
                    <textarea 
                      className="w-full bg-surface-container-low border border-outline-variant focus:ring-2 focus:ring-accent/20 focus:border-accent rounded-xl p-4 text-on-surface placeholder:text-on-surface-variant/40 transition-all text-sm font-medium resize-none outline-none" 
                      placeholder="例如：宽敞的客厅，安静的社区，适合老年宠物的无障碍环境..." 
                      rows={5}
                      value={formData.housingDescription}
                      onChange={(e) => setFormData({ ...formData, housingDescription: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 bg-white border border-outline-variant rounded-xl business-shadow">
                    <div className="flex flex-col">
                      <span className="font-headline font-bold text-on-surface text-base tracking-tight">户外空间</span>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">你有带围栏的院子或露台吗？</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setHasOutdoorSpace(!hasOutdoorSpace)}
                      className={cn(
                        "relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                        hasOutdoorSpace ? "bg-accent" : "bg-outline-variant"
                      )}
                    >
                      <span className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200",
                        hasOutdoorSpace ? "translate-x-6" : "translate-x-0"
                      )} />
                    </button>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <History size={24} className="text-accent" />
                  </div>
                  <h2 className="font-headline font-bold text-2xl tracking-tight text-on-surface">养宠经验</h2>
                </div>

                <div className="space-y-6">
                  <label className="block font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 ml-1">你对宠物的了解和相处程度如何？</label>
                  <div className="space-y-4">
                    {[
                      { id: 'new', title: '第一次养宠', desc: '我准备好了学习并提供一个充满爱的家。' },
                      { id: 'some', title: '有一点点经验', desc: '我曾短期照顾过宠物或帮助过朋友养宠。' },
                      { id: 'experienced', title: '资深宠爸宠妈', desc: '我有超过5年的养宠经验，非常了解它们的需求。' }
                    ].map((opt) => (
                      <label 
                        key={opt.id}
                        onClick={() => setExperience(opt.id as any)}
                        className={cn(
                          "flex items-start gap-5 p-5 rounded-xl bg-white border transition-all cursor-pointer business-shadow active:scale-[0.99]",
                          experience === opt.id ? "border-accent bg-accent/5 ring-2 ring-accent/10" : "border-outline-variant hover:border-accent/50"
                        )}
                      >
                        <div className={cn(
                          "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          experience === opt.id ? "border-accent" : "border-outline-variant"
                        )}>
                          {experience === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                        </div>
                        <div className="flex flex-col">
                          <span className={cn("font-headline font-bold text-base tracking-tight", experience === opt.id ? "text-accent" : "text-on-surface")}>{opt.title}</span>
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1.5 font-medium">{opt.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              <section className="space-y-8 pt-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <PawPrint size={24} className="text-accent" />
                  </div>
                  <h2 className="font-headline font-bold text-2xl tracking-tight text-on-surface">当前养宠情况</h2>
                </div>

                <div className="p-8 bg-white border border-outline-variant rounded-2xl business-shadow space-y-6">
                  <p className="text-sm text-on-surface-variant leading-relaxed font-light italic border-l-4 border-accent pl-4">
                    “引入新成员需要周密的计划。了解你现有的宠物有助于我们确保每位成员都能顺利过渡。”
                  </p>
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 no-scrollbar">
                    <div className="flex-shrink-0 w-24 h-24 rounded-2xl bg-surface-container-low flex flex-col items-center justify-center gap-2 group cursor-pointer hover:bg-accent/10 transition-colors border border-dashed border-outline-variant">
                      <Plus size={24} className="text-accent" />
                      <span className="font-label text-[9px] font-bold text-accent uppercase tracking-widest">添加宠物</span>
                    </div>
                    <div className="flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden relative group border border-outline-variant business-shadow">
                      <img 
                        alt="当前宠物" 
                        className="w-full h-full object-cover" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfRSZGqemm6bfHDoKPMnR73CLHFv4MQvz_i_6YXGBtWb7LuOPBUCVjQb3zCbaFbboMj7YFv3RACmzFURiowDtJWe7zMupF0eBR00KZ5jxPn4wMkjcFYMvgwB3HCj7ibppl3hp88x0vbG7C_YTxitf9xup4VRzn-wvEdsdPr3EdZeUcigQwWUTQ7Pi014AjvedsdepLMfcF4e9bYGcHZj4GpUxeEnNZjqTRbnkv-4cqEa1fHgHG7iuxlJhJOpC7TbLNyAyMqacsrHlX"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Edit2 size={18} className="text-white" />
                      </div>
                      <div className="absolute bottom-2 left-2 bg-white/95 px-2 py-0.5 rounded-lg business-shadow">
                        <span className="font-label text-[8px] font-bold text-on-surface uppercase tracking-widest">MAX</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <section className="text-center space-y-8 py-12">
                <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 business-shadow">
                  <CheckCircle2 size={48} className="text-accent" />
                </div>
                <div className="space-y-3">
                  <h2 className="font-headline font-bold text-3xl tracking-tight text-on-surface">准备好提交了吗？</h2>
                  <p className="text-on-surface-variant leading-relaxed max-w-sm mx-auto text-base font-light">
                    请确认您填写的所有信息真实有效。提交后，我们的志愿者将在 <span className="text-accent font-bold">3-5 个工作日</span> 内与您联系。
                  </p>
                </div>
                
                <div className="bg-white border border-outline-variant p-8 rounded-2xl text-left space-y-6 business-shadow">
                  <h3 className="font-headline font-bold text-[11px] uppercase tracking-[0.25em] text-on-surface-variant border-b border-outline-variant pb-3">申请须知</h3>
                  <ul className="space-y-4">
                    {[
                      '领养是终身的承诺，请确保全家人都同意。',
                      '志愿者可能会要求进行视频看房或实地走访。',
                      '领养成功后需定期进行线上回访。'
                    ].map((item, i) => (
                      <li key={i} className="flex gap-4 text-sm text-on-surface-variant font-medium">
                        <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <label className="flex items-start gap-4 cursor-pointer group text-left bg-surface-container-low p-6 rounded-2xl border border-outline-variant business-shadow">
                    <div className="relative flex items-center mt-1">
                      <input 
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-outline-variant bg-white transition-all checked:bg-accent checked:border-accent"
                      />
                      <CheckCircle2 
                        size={16} 
                        className="absolute left-1 top-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" 
                      />
                    </div>
                    <span className="text-sm text-on-surface-variant leading-relaxed font-medium">
                      我已阅读并同意
                      <button 
                        type="button"
                        onClick={() => setShowAgreementModal(true)}
                        className="text-accent font-bold hover:underline mx-1.5"
                      >
                        《萌爪家园领养电子协议》
                      </button>
                      ，承诺将诚信填写信息并对领养行为负责。
                    </span>
                  </label>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAgreementModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAgreementModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-2xl p-10 business-shadow-lg space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar border border-outline-variant"
              >
                <div className="flex justify-between items-center border-b border-outline-variant pb-6">
                  <h2 className="font-headline font-bold text-2xl text-on-surface tracking-tight uppercase tracking-widest">领养电子协议</h2>
                  <button onClick={() => setShowAgreementModal(false)} className="p-2 hover:bg-surface-container rounded-xl transition-colors">
                    <X size={24} className="text-on-surface-variant" />
                  </button>
                </div>
                
                <div className="prose prose-stone prose-sm max-w-none text-on-surface-variant leading-relaxed space-y-6">
                  <div className="space-y-2">
                    <p className="font-bold text-on-surface uppercase tracking-widest text-[11px]">第一条：领养原则</p>
                    <p className="font-light text-base">领养人承诺出于喜爱动物的目的领养，不虐待、不遗弃、不转卖、不食用。确保领养行为已获得家庭成员的一致同意。</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-bold text-on-surface uppercase tracking-widest text-[11px]">第二条：生活保障</p>
                    <p className="font-light text-base">领养人应提供适宜的居住环境，提供科学的饮食，定期进行疫苗接种、体内外驱虫，并在适龄时进行绝育手术。</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-bold text-on-surface uppercase tracking-widest text-[11px]">第三条：安全防护</p>
                    <p className="font-light text-base">领养人承诺安装防护窗/网，防止宠物坠楼或走失。外出时必须佩戴牵引绳，确保宠物及他人安全。</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-bold text-on-surface uppercase tracking-widest text-[11px]">第四条：回访义务</p>
                    <p className="font-light text-base">领养人同意配合送养方进行定期回访（包括但不限于照片、视频或实地走访），如实反馈宠物生活状况。</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-bold text-on-surface uppercase tracking-widest text-[11px]">第五条：违约责任</p>
                    <p className="font-light text-base">若领养人违反上述协议，送养方有权收回宠物。若发生虐待等违法行为，送养方将保留追究法律责任的权利。</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setAgreedToTerms(true);
                    setShowAgreementModal(false);
                  }}
                  className="w-full py-5 bg-accent text-white font-bold rounded-xl business-shadow active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs"
                >
                  我已阅读并同意
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-6 pt-10 border-t border-outline-variant/30">
          <button 
            type="button"
            onClick={handleBack}
            className="flex-1 py-4 font-headline font-bold text-on-surface-variant bg-surface-container-low rounded-xl hover:bg-surface-container transition-all active:scale-[0.98] duration-200 uppercase tracking-widest text-xs border border-outline-variant"
          >
            {currentStep === 1 ? '取消' : '上一步'}
          </button>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] py-4 font-headline font-bold text-white bg-accent rounded-xl business-shadow hover:bg-accent/90 transition-all active:scale-[0.98] duration-200 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '正在提交...' : currentStep === 4 ? '确认提交' : '下一步'}
            <ArrowRight size={18} />
          </button>
        </div>
      </form>

      <div className="mt-24 p-10 rounded-2xl bg-white border border-outline-variant business-shadow relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 ring-4 ring-surface-container business-shadow">
            <img 
              alt="咨询师" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjpRP8SMz4Tb2P_D-9gTO2sQnxad-PawvFFTRrryqiZHzFOzgrbrLvm6vXOBw-3b5AowGzs2UE3KXMcF2bBvijTcgUbJmXQTgwqO5JXIBRFAeQNrjA7tpXl2gywoNZpMe0J8ulRSO4rC5WaokhGcanU0F0B76saaEUwuEKonU_XOUuirxTQHplC5v_9mIyWGPXQXpPWrl09xSnpBsJ-Rrf1s1Qmp9kP2iQUBwriiF-iHqBZ8wge6rLiCFgNJpE2IiS9amPGc7F1shn"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-center md:text-left">
            <span className="font-label text-[10px] uppercase tracking-[0.25em] text-accent font-bold">为什么这很重要</span>
            <h3 className="font-headline font-bold text-2xl mb-3 tracking-tight text-on-surface">我们的匹配机制</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed font-light">
              我们不仅仅是找一个家；我们致力于让宠物的灵魂与家庭的节奏实现<span className="text-accent font-bold">完美契合</span>。您提供的细节能帮助我们保护动物，同时也保障您家庭的幸福。
            </p>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
      </div>
    </main>
  );
}
