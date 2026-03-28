import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Calendar, Settings, BookOpen, Package } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const menuItems = [
    { icon: Calendar, label: 'Meal Planner', path: '/meal-planner' },
    { icon: ShoppingCart, label: 'Shopping List', path: '/shopping-list' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: BookOpen, label: 'Recipes', path: '/' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: (isOpen || isDesktop) ? 0 : '-100%' }}
        transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
        className={`fixed top-0 left-0 h-full w-[85%] bg-m3-surface border-r border-m3-outline/10 z-[60] lg:static lg:w-80 flex flex-col`}
      >
        <div className="p-8 flex items-center gap-3 border-b border-m3-outline/5">
          <h1 className="text-2xl font-black tracking-tight text-m3-on-surface">Mise</h1>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()}
              className={({ isActive }) => `
                flex items-center gap-4 px-6 py-4 rounded-[20px] font-bold transition-all
                ${isActive 
                  ? 'bg-m3-primary-container text-m3-on-primary-container shadow-sm' 
                  : 'text-m3-on-surface-variant hover:bg-m3-surface-variant/30 hover:text-m3-on-surface'}
              `}
            >
              <item.icon size={24} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </motion.aside>
    </>
  );
};