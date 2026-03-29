import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, ShoppingCart, Package, BookOpen } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';

interface HomePageProps {
  onMenuClick: () => void;
}

export const HomePage = ({ onMenuClick }: HomePageProps) => {
  const pages = [
    {
      icon: Calendar,
      title: 'Meal Planner',
      description: 'Plan your meals for the week ahead',
      path: '/meal-planner',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: ShoppingCart,
      title: 'Shopping List',
      description: 'Organize your grocery shopping',
      path: '/shopping-list',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Package,
      title: 'Inventory',
      description: 'Track your pantry and ingredients',
      path: '/inventory',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: BookOpen,
      title: 'Recipes',
      description: 'Browse and manage your recipes',
      path: '/recipes',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-m3-surface">
      <PageHeader title="Home" onMenuClick={onMenuClick} />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-m3-on-surface tracking-tight mb-3">
              Welcome to Mise
            </h1>
            <p className="text-lg text-m3-on-surface-variant">
              Your complete kitchen companion for meal planning, shopping, and cooking
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4 max-w-md">
            {pages.map((page, index) => (
              <motion.div
                key={page.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                whileTap={{ y: -8, scale: 0.98 }}
              >
                <Link
                  to={page.path}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-m3-surface-container hover:bg-m3-surface-container-high transition-colors duration-300 hover:shadow-lg block"
                >
                  <div className={`flex-shrink-0 p-3 rounded-xl bg-gradient-to-br ${page.color}`}>
                    <page.icon size={24} className="text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-m3-on-surface group-hover:text-m3-primary transition-colors">
                      {page.title}
                    </h3>
                    <p className="text-sm text-m3-on-surface-variant">
                      {page.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};