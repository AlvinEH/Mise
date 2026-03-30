import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, ExternalLink } from 'lucide-react';

interface FABMenuProps {
  onNavigate: (path: string) => void;
}

export const FABMenu: React.FC<FABMenuProps> = memo(({ onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative">
      {/* Main FAB */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-14 h-14 bg-m3-primary text-m3-on-primary rounded-[16px] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
        title="Add New Recipe"
      >
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <Plus size={24} strokeWidth={2} />
        </motion.div>
      </button>

      {/* Expandable Options */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 bg-black/20 -z-10"
            />
            
            {/* Manual Add Button */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: 0.15,
                ease: [0.34, 1.56, 0.64, 1],
                delay: 0.02
              }}
              onClick={() => {
                setIsExpanded(false);
                onNavigate('/add-recipe?mode=manual');
              }}
              className="absolute bottom-16 right-0 w-11 h-11 bg-m3-surface-container-high text-m3-on-surface rounded-[12px] shadow-md hover:shadow-lg flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-200"
              title="Manual Add"
            >
              <Edit2 size={18} strokeWidth={2} />
            </motion.button>

            {/* URL Add Button */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: 0.15,
                ease: [0.34, 1.56, 0.64, 1],
                delay: 0.04
              }}
              onClick={() => {
                setIsExpanded(false);
                onNavigate('/add-recipe?mode=url');
              }}
              className="absolute bottom-28 right-0 w-11 h-11 bg-m3-surface-container-high text-m3-on-surface rounded-[12px] shadow-md hover:shadow-lg flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-200"
              title="From URL"
            >
              <ExternalLink size={18} strokeWidth={2} />
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});