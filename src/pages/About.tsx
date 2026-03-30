import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PawPrint, Heart, ShieldCheck, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function About() {
  const navigate = useNavigate();

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
          <span className="font-headline font-bold text-on-surface text-xl tracking-tight uppercase tracking-widest">关于我们</span>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-screen-md mx-auto space-y-12">
        <section className="text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-accent rounded-3xl mx-auto flex items-center justify-center text-white business-shadow-lg"
          >
            <PawPrint size={48} />
          </motion.div>
          <div className="space-y-2">
            <h1 className="font-headline font-bold text-3xl text-on-surface tracking-tight uppercase tracking-widest">萌爪家园</h1>
            <p className="text-on-surface-variant font-medium text-sm">Version 1.0.0 (Build 20260325)</p>
          </div>
        </section>

        <section className="bg-white p-8 rounded-2xl business-shadow border border-outline-variant space-y-6">
          <h2 className="font-headline font-bold text-xl text-on-surface tracking-tight uppercase tracking-widest flex items-center gap-3">
            <Info className="text-accent" size={24} />
            我们的使命
          </h2>
          <p className="text-on-surface-variant leading-relaxed font-light text-base">
            萌爪家园是一个致力于连接流浪动物与温暖家庭的公益平台。我们相信每一个生命都值得被温柔以待，每一只流浪的小动物都应该拥有一个属于自己的家。
          </p>
          <p className="text-on-surface-variant leading-relaxed font-light text-base">
            通过现代化的互联网技术，我们简化了领养和寄养的流程，提高了救助效率，让爱心能够更精准地传递。
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl business-shadow border border-outline-variant space-y-4">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
              <Heart size={24} />
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface tracking-tight">爱心领养</h3>
            <p className="text-on-surface-variant text-sm font-light leading-relaxed">
              为救助站的流浪动物寻找永久的领养家庭，开启它们的新生活。
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl business-shadow border border-outline-variant space-y-4">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface tracking-tight">安全寄养</h3>
            <p className="text-on-surface-variant text-sm font-light leading-relaxed">
              为有临时困难的宠主提供可靠的寄养信息发布平台，确保宠物安全。
            </p>
          </div>
        </section>

        <section className="pt-10 text-center">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-[0.3em]">© 2026 萌爪家园公益组织 版权所有</p>
        </section>
      </main>
    </div>
  );
}
