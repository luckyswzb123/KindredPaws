import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Heart, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { messagesApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      messagesApi.list().then(res => {
        if (res.success) setUnreadCount(res.unread_count || 0);
      }).catch(console.error);
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, location.pathname]); // Refresh when navigating around

  // Hide bottom nav on specific routes if needed
  const hideOn = ['/login', '/welcome', '/apply', '/pet', '/chat'];
  if (hideOn.some(path => location.pathname.startsWith(path))) return null;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/80 backdrop-blur-xl border-t border-outline-variant flex justify-around items-center px-6 py-3 pb-safe business-shadow-lg">
      <NavLink 
        to="/home" 
        className={({ isActive }) => cn(
          "flex flex-col items-center justify-center px-4 py-1 transition-all duration-300 active:scale-90",
          isActive ? "text-accent" : "text-on-surface-variant hover:text-on-surface"
        )}
      >
        {({ isActive }) => (
          <>
            <Home size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className={cn(
              "text-[9px] uppercase tracking-[0.15em] mt-1.5 font-bold transition-all",
              isActive ? "opacity-100" : "opacity-60"
            )}>首页</span>
          </>
        )}
      </NavLink>
      
      <NavLink 
        to="/messages" 
        className={({ isActive }) => cn(
          "flex flex-col items-center justify-center px-4 py-1 transition-all duration-300 active:scale-90 relative",
          isActive ? "text-accent" : "text-on-surface-variant hover:text-on-surface"
        )}
      >
        {({ isActive }) => (
          <>
            <div className="relative">
              <MessageSquare size={22} strokeWidth={isActive ? 2.5 : 2} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full border border-white" />
              )}
            </div>
            <span className={cn(
              "text-[9px] uppercase tracking-[0.15em] mt-1.5 font-bold transition-all",
              isActive ? "opacity-100" : "opacity-60"
            )}>消息</span>
          </>
        )}
      </NavLink>

      <NavLink 
        to="/favorites" 
        className={({ isActive }) => cn(
          "flex flex-col items-center justify-center px-4 py-1 transition-all duration-300 active:scale-90",
          isActive ? "text-accent" : "text-on-surface-variant hover:text-on-surface"
        )}
      >
        {({ isActive }) => (
          <>
            <Heart size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className={cn(
              "text-[9px] uppercase tracking-[0.15em] mt-1.5 font-bold transition-all",
              isActive ? "opacity-100" : "opacity-60"
            )}>收藏</span>
          </>
        )}
      </NavLink>

      <NavLink 
        to="/profile" 
        className={({ isActive }) => cn(
          "flex flex-col items-center justify-center px-4 py-1 transition-all duration-300 active:scale-90",
          isActive ? "text-accent" : "text-on-surface-variant hover:text-on-surface"
        )}
      >
        {({ isActive }) => (
          <>
            <User size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className={cn(
              "text-[9px] uppercase tracking-[0.15em] mt-1.5 font-bold transition-all",
              isActive ? "opacity-100" : "opacity-60"
            )}>我的</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
