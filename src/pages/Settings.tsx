import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Shield, Globe, HelpCircle, ChevronRight, LogOut, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const navigate = useNavigate();

  const sections = [
    {
      title: '账户与安全',
      items: [
        { icon: <Shield size={20} />, label: '修改密码', value: '' },
        { icon: <Globe size={20} />, label: '隐私设置', value: '仅好友可见' },
      ]
    },
    {
      title: '偏好设置',
      items: [
        { icon: <Bell size={20} />, label: '通知提醒', value: '已开启' },
        { icon: <Globe size={20} />, label: '语言选择', value: '简体中文' },
      ]
    },
    {
      title: '支持与反馈',
      items: [
        { icon: <HelpCircle size={20} />, label: '帮助中心', value: '' },
        { icon: <HelpCircle size={20} />, label: '意见反馈', value: '' },
      ]
    }
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
          <span className="font-headline font-bold text-on-surface text-xl tracking-tight uppercase tracking-widest">设置</span>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-screen-md mx-auto space-y-10">
        {sections.map((section, idx) => (
          <section key={idx} className="space-y-4">
            <h2 className="font-headline font-bold text-[10px] text-on-surface-variant uppercase tracking-[0.3em] ml-2">{section.title}</h2>
            <div className="bg-white rounded-2xl business-shadow border border-outline-variant overflow-hidden">
              {section.items.map((item, i) => (
                <button 
                  key={i}
                  onClick={() => alert(`${item.label} 功能即将上线`)}
                  className="w-full flex items-center justify-between p-5 hover:bg-surface-container transition-colors group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-on-surface-variant group-hover:text-accent transition-colors">
                      {item.icon}
                    </div>
                    <span className="font-headline font-bold text-sm text-on-surface uppercase tracking-widest">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.value && <span className="text-xs text-on-surface-variant font-medium">{item.value}</span>}
                    <ChevronRight size={18} className="text-on-surface-variant/40" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}

        <section className="space-y-4 pt-6">
          <div className="bg-white rounded-2xl business-shadow border border-outline-variant overflow-hidden">
            <button 
              onClick={() => {
                if (confirm('确定要清除所有缓存吗？')) {
                  alert('缓存已清除');
                }
              }}
              className="w-full flex items-center justify-between p-5 hover:bg-error/5 transition-colors group active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <Trash2 size={20} className="text-error" />
                <span className="font-headline font-bold text-sm text-error uppercase tracking-widest">清除缓存</span>
              </div>
              <span className="text-xs text-on-surface-variant font-medium">12.4 MB</span>
            </button>
            <button 
              onClick={() => {
                if (confirm('确定要退出登录吗？')) {
                  navigate('/welcome');
                }
              }}
              className="w-full flex items-center justify-between p-5 hover:bg-error/5 transition-colors group active:scale-[0.99] border-t border-outline-variant"
            >
              <div className="flex items-center gap-4">
                <LogOut size={20} className="text-error" />
                <span className="font-headline font-bold text-sm text-error uppercase tracking-widest">退出登录</span>
              </div>
            </button>
          </div>
        </section>

        <section className="pt-10 text-center">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.3em]">萌爪家园 v1.0.0</p>
        </section>
      </main>
    </div>
  );
}
