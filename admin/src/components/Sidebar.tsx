import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PawPrint, FileText, Settings, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const SidebarItem = ({ to, icon, label }: SidebarItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        isActive
          ? "bg-accent text-white business-shadow ring-4 ring-accent/10"
          : "text-on-surface-variant hover:bg-surface-container hover:text-accent"
      )
    }
  >
    <div className="shrink-0">{icon}</div>
    <span className="font-headline font-bold text-sm tracking-widest uppercase">{label}</span>
  </NavLink>
);

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-outline-variant flex flex-col p-8 z-50">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white business-shadow">
          <PawPrint size={24} />
        </div>
        <span className="font-headline font-bold text-on-surface text-xl uppercase tracking-widest">萌爪后台</span>
      </div>

      <nav className="flex-grow space-y-2">
        <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="仪表盘" />
        <SidebarItem to="/pets" icon={<PawPrint size={20} />} label="宠物管理" />
        <SidebarItem to="/applications" icon={<FileText size={20} />} label="领养审批" />
      </nav>

      <div className="pt-8 border-t border-outline-variant mt-auto">
        <SidebarItem to="/settings" icon={<Settings size={20} />} label="系统设置" />
        <button 
          onClick={async () => {
            if (confirm('确定要退出管理系统吗？')) {
               await supabase.auth.signOut();
               localStorage.removeItem('kp_access_token');
               window.location.href = '/login';
            }
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-error hover:bg-error/5 transition-all mt-2 group"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          <span className="font-headline font-bold text-sm tracking-widest uppercase">退出系统</span>
        </button>
      </div>
    </aside>
  );
}
