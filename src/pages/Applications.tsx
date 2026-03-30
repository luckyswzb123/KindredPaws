import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, XCircle, Clock, ChevronRight, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useApplications } from '../context/ApplicationContext';

export default function Applications() {
  const navigate = useNavigate();
  const { applications, updateApplicationStatus } = useApplications();
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');

  const sentApplications = applications.filter(app => app.type === 'adoption');
  const receivedApplications = applications.filter(app => app.type === 'foster');

  const tabs = [
    { id: 'sent', label: '我的申请', count: sentApplications.length },
    { id: 'received', label: '收到的申请', count: receivedApplications.filter(a => a.status === 'reviewing').length }
  ];

  return (
    <div className="bg-background min-h-screen pb-20">
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant business-shadow">
        <div className="flex items-center gap-4 px-6 h-16">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface-container rounded-xl transition-colors active:scale-95"
          >
            <ArrowLeft size={24} className="text-on-surface" />
          </button>
          <span className="font-headline font-bold text-on-surface text-xl tracking-tight uppercase tracking-widest">申请管理</span>
        </div>
        
        <div className="flex px-6 border-t border-outline-variant/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative",
                activeTab === tab.id ? "text-accent" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {tab.label}
              {tab.id === 'received' && tab.count > 0 && (
                <span className="ml-2 bg-error text-white px-1.5 py-0.5 rounded-full text-[8px]">{tab.count}</span>
              )}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                />
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="pt-36 px-6 max-w-screen-md mx-auto space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'sent' ? (
            <motion.div 
              key="sent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {sentApplications.length > 0 ? (
                sentApplications.map(app => (
                  <div 
                    key={app.id}
                    className="bg-white p-5 rounded-2xl business-shadow border border-outline-variant flex items-center gap-5 group hover:border-accent transition-all"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-outline-variant">
                      <img className="w-full h-full object-cover" src={app.petImage} referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-headline font-bold text-on-surface truncate text-base">{app.petName}</h3>
                        <div className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5",
                          app.status === 'approved' ? "bg-accent/10 text-accent" : 
                          app.status === 'rejected' ? "bg-error/10 text-error" :
                          "bg-surface-container text-on-surface-variant"
                        )}>
                          {app.status === 'approved' ? <CheckCircle2 size={12} /> : 
                           app.status === 'rejected' ? <XCircle size={12} /> : 
                           <Clock size={12} />}
                          {app.status === 'approved' ? '已通过' : app.status === 'rejected' ? '未通过' : '审核中'}
                        </div>
                      </div>
                      <p className="font-body text-xs text-on-surface-variant mt-1">{app.petBreed} • {app.petAge}</p>
                      <p className="text-[10px] text-on-surface-variant/60 mt-2 font-medium uppercase tracking-wider">申请时间: 2026-03-24</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center bg-surface-container-low rounded-3xl border border-dashed border-outline-variant">
                  <FileText size={48} className="mx-auto text-on-surface-variant/20 mb-4" />
                  <p className="text-sm text-on-surface-variant font-medium">暂无领养申请记录</p>
                  <button 
                    onClick={() => navigate('/home')}
                    className="mt-6 px-8 py-3 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-widest business-shadow"
                  >
                    去看看小动物
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="received"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {receivedApplications.length > 0 ? (
                receivedApplications.map(app => (
                  <div 
                    key={app.id}
                    className="bg-white p-6 rounded-2xl business-shadow border border-outline-variant space-y-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface-container border border-outline-variant">
                        <img 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDskq6dmsFEJ_A4Un3nEULgU7PERsdrE48GjJhQ9xZIJwK3upPr31hsihL-dXWQcK3SzHVgOby5I57Ssrt2BCsOmT3-Rzi8HvHIqGgZQR_oomNIRF4FAJW0DAl6WNYRmnT59IS-ZgesBy-AnQMTQ_58DNLR__oMuRyzkeQ_uGL3DrwLQvReQMZI5bhwumSzjwtYlorbUhdIcv6ZEcetnfI-kfRXXgjh_zEEP4uIRCHNEP6FUmjA0H7HPLI_QLf7D8ENXIlDgLN1vKSY" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-base text-on-surface">{app.applicantName}</h4>
                          <button className="text-accent p-2 hover:bg-accent/5 rounded-lg transition-colors">
                            <MessageSquare size={18} />
                          </button>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">申请寄养 <span className="font-bold text-on-surface">{app.petName}</span></p>
                      </div>
                    </div>

                    <div className="bg-surface-container-low p-4 rounded-xl space-y-3">
                      <p className="text-xs text-on-surface-variant leading-relaxed italic">"{app.applicantBio}"</p>
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex flex-col">
                          <span className="text-[8px] uppercase tracking-widest text-on-surface-variant font-bold">养宠经验</span>
                          <span className="text-[10px] font-bold text-on-surface">3年</span>
                        </div>
                        <div className="w-px h-6 bg-outline-variant" />
                        <div className="flex flex-col">
                          <span className="text-[8px] uppercase tracking-widest text-on-surface-variant font-bold">居住环境</span>
                          <span className="text-[10px] font-bold text-on-surface">自有住房</span>
                        </div>
                      </div>
                    </div>

                    {app.status === 'reviewing' ? (
                      <div className="flex gap-4">
                        <button 
                          onClick={() => updateApplicationStatus(app.id, 'approved')}
                          className="flex-1 py-4 bg-accent text-white text-xs font-bold rounded-xl active:scale-[0.98] transition-all business-shadow uppercase tracking-widest"
                        >
                          批准申请
                        </button>
                        <button 
                          onClick={() => updateApplicationStatus(app.id, 'rejected')}
                          className="flex-1 py-4 bg-white border border-outline-variant text-on-surface text-xs font-bold rounded-xl active:scale-[0.98] transition-all uppercase tracking-widest"
                        >
                          拒绝
                        </button>
                      </div>
                    ) : (
                      <div className={cn(
                        "text-center py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em]",
                        app.status === 'approved' ? "bg-accent/10 text-accent" : "bg-error/10 text-error"
                      )}>
                        {app.status === 'approved' ? '已通过' : '已拒绝'}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-20 text-center bg-surface-container-low rounded-3xl border border-dashed border-outline-variant">
                  <FileText size={48} className="mx-auto text-on-surface-variant/20 mb-4" />
                  <p className="text-sm text-on-surface-variant font-medium">暂无收到的申请</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
