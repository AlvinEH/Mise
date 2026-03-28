import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Maximize2, Trash2 } from 'lucide-react';
import { StoreList, ShoppingItem } from '../../types';
import { ShoppingListContent } from './ShoppingListContent';

interface StoreCardProps {
  list: StoreList;
  items: ShoppingItem[];
  onAddItem: (name: string) => void;
  onToggleItem: (item: ShoppingItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteStore: () => void;
  onClearCompleted: () => void;
  onReorder: (newItems: ShoppingItem[]) => void;
  onExpand?: () => void;
}

export const StoreCard = ({ 
  list, 
  items, 
  onAddItem, 
  onToggleItem, 
  onDeleteItem, 
  onDeleteStore,
  onClearCompleted,
  onReorder,
  onExpand
}: StoreCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const completedCount = items.filter(i => i.completed).length;

  return (
    <motion.div 
      layout="position"
      className="bg-m3-surface border border-m3-outline/10 rounded-2xl lg:rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
    >
      <div 
        className="p-4 lg:p-6 bg-m3-surface-variant/10 border-b border-m3-outline/5 flex items-center justify-between cursor-pointer hover:bg-m3-surface-variant/15 transition-all"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex flex-col overflow-hidden">
            <h3 className="text-xl font-black text-m3-on-surface truncate">{list.name}</h3>
            <span className="text-[10px] font-bold text-m3-on-surface-variant/60 uppercase tracking-wider">
              {items.length} items
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="p-2 text-m3-on-surface-variant/40 transition-all">
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </div>
          {onExpand && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="p-2 text-m3-on-surface-variant/40 hover:text-m3-primary hover:bg-m3-primary/10 rounded-full transition-all"
              title="Full Screen"
            >
              <Maximize2 size={18} />
            </button>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete list for ${list.name}?`)) onDeleteStore();
            }}
            className="p-2 text-m3-on-surface-variant/40 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col overflow-hidden h-[400px] lg:h-[450px]"
          >
            <ShoppingListContent
              items={items}
              onAddItem={onAddItem}
              onToggleItem={onToggleItem}
              onDeleteItem={onDeleteItem}
              onClearCompleted={onClearCompleted}
              onReorder={onReorder}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};