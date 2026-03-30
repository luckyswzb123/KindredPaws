import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen flex flex-col bg-background">
      <section className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <img 
          alt="Woman hugging a happy rescue dog" 
          className="absolute inset-0 w-full h-full object-cover" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCZlLPmGZeHq7obxWWWfY-X0CAolP9u3axYkFpOJYSVkEvzhNqScfazJHAlMImT89EzYIEwiBC1yyEv4AjzURRBRlTjTScgQQpA1lS-TgXfyobYixOnB8s8g-IK1nQPt--wWxOCs2V_kr3mL5Fkm4xu2umof96XSKEEqA-OS-2Z1KE6QkxKObJPhIsYXqNMPsIPPFwMR4CjSFt9uW80vsYwBvdU_FnfGGov9d1kmY8yH1izJ8PG6LYRuBA-dgLIi4mHx6-z97aNw2r"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute top-8 left-0 right-0 px-6 flex justify-between items-center z-10">
          <h1 className="text-white drop-shadow-md font-headline font-extrabold text-2xl">萌爪家园</h1>
        </div>
      </section>

      <motion.section 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative -mt-20 flex-grow bg-background rounded-t-[3rem] px-8 pt-10 pb-32"
      >
        <div className="max-w-2xl mx-auto">
          <div className="mb-10 text-center">
            <p className="font-label text-primary font-semibold tracking-widest uppercase text-xs mb-3">欢迎</p>
            <h2 className="font-headline font-extrabold text-4xl text-on-surface leading-tight mb-4">
              为每一只孤独的小爪子找到<span className="text-primary-container">灵魂伴侣。</span>
            </h2>
            <p className="text-on-surface-variant leading-relaxed">每一个摇摆的尾巴和温柔的呼噜声，都讲述着一个等待开启新篇章的故事。</p>
          </div>

          <div className="bg-surface-container-low p-8 rounded-lg mb-12 border border-outline-variant/20">
            <h3 className="font-headline font-bold text-xl mb-4 text-primary">我们的使命</h3>
            <p className="text-on-surface-variant leading-relaxed text-sm">
              萌爪家园搭建起动物收容所与充满爱的家庭之间的桥梁。我们相信领养不仅仅是一次交易——它是通过关爱、共情和专业指导，寻找完美伴侣的一段旅程。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 mb-12">
            {[
              { icon: 'Sparkles', title: '智能匹配', desc: '我们的直观流程会根据您的生活方式、精力水平和家庭环境，为您寻找最契合的宠物。' },
              { icon: 'FileText', title: '便捷领养', desc: '通过我们的无缝数字化申请和状态追踪系统，轻松开启领养之旅。' },
              { icon: 'HeartHandshake', title: '专家支持', desc: '获得资深领养志愿者的持续指导，确保您和您的新宠能够顺利度过过渡期。' }
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-5">
                <div className="w-12 h-12 shrink-0 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                  <div className="w-6 h-6 bg-current opacity-20 rounded-full" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-lg text-on-surface">{feature.title}</h4>
                  <p className="text-on-surface-variant text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-12 z-50">
        <div className="max-w-2xl mx-auto flex flex-col gap-4 items-center">
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-full text-base uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
          >
            登录
          </button>
          <button 
            onClick={() => alert('注册功能即将上线！')}
            className="text-primary font-bold text-base uppercase tracking-widest active:opacity-70 transition-all"
          >
            注册
          </button>
          <p className="text-center text-[10px] uppercase tracking-widest font-label font-bold text-on-surface-variant opacity-60">
            加入 5,000+ 个幸福家庭
          </p>
        </div>
      </div>
    </main>
  );
}
