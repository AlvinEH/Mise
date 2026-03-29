import React, { useState } from 'react';
import { Reorder } from 'motion/react';
import { GripVertical, Check, X, Plus } from 'lucide-react';
import { ShoppingItem } from '../../types';
import { getShoppingItemDisplayText } from '../../utils/shoppingItems';

interface ShoppingListContentProps {
  items: ShoppingItem[];
  onAddItem: (name: string) => void;
  onToggleItem: (item: ShoppingItem) => void;
  onDeleteItem: (id: string) => void;
  onClearCompleted: () => void;
  onReorder: (newItems: ShoppingItem[]) => void;
  isExpanded?: boolean;
}

export const ShoppingListContent = ({ 
  items, 
  onAddItem, 
  onToggleItem, 
  onDeleteItem, 
  onClearCompleted,
  onReorder,
  isExpanded = false
}: ShoppingListContentProps) => {
  const [newItemName, setNewItemName] = useState('');
  const completedCount = items.filter(i => i.completed).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
      onAddItem(newItemName.trim());
      setNewItemName('');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className={`flex-1 overflow-y-auto ${isExpanded ? 'p-4 sm:p-8' : 'p-4 lg:p-6'}`}>
        {items.length > 0 ? (
          <Reorder.Group 
            axis="y" 
            values={items} 
            onReorder={onReorder}
            className="space-y-2 lg:space-y-3"
          >
            {items.map(item => (
              <Reorder.Item 
                key={item.id} 
                value={item}
                className={`flex items-center gap-2 lg:gap-3 p-2 lg:p-3 rounded-xl lg:rounded-2xl transition-all group ${item.completed ? 'bg-m3-surface-variant/5 opacity-60' : 'bg-m3-surface-variant/10'}`}
              >
                <div className="cursor-grab active:cursor-grabbing text-m3-on-surface-variant/20 hover:text-m3-on-surface-variant/40 transition-colors shrink-0">
                  <GripVertical size={16} />
                </div>
                <button 
                  onClick={() => onToggleItem(item)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${item.completed ? 'bg-m3-primary border-m3-primary text-m3-on-primary' : 'border-m3-outline/30 hover:border-m3-primary'}`}
                >
                  {item.completed && <Check size={14} strokeWidth={4} />}
                </button>
                <span className={`flex-1 font-bold text-sm ${item.completed ? 'line-through text-m3-on-surface-variant' : 'text-m3-on-surface'}`}>
                  {getShoppingItemDisplayText(item)}
                </span>
                <button 
                  onClick={() => onDeleteItem(item.id)}
                  className={`${isExpanded ? 'opacity-100' : 'lg:opacity-0 lg:group-hover:opacity-100'} p-1.5 text-m3-on-surface-variant/40 hover:text-red-600 transition-all`}
                >
                  <X size={16} />
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <p className="text-m3-on-surface-variant/40 font-bold text-sm italic">No items yet</p>
          </div>
        )}
      </div>

      <div className={`${isExpanded ? 'p-6 sm:p-10' : 'p-4 lg:p-6'} border-t border-m3-outline/5 space-y-3 lg:space-y-4`}>
        {completedCount > 0 && (
          <button 
            onClick={onClearCompleted}
            className="w-full text-[10px] lg:text-xs font-black text-m3-primary uppercase tracking-widest hover:underline"
          >
            Clear {completedCount} Completed
          </button>
        )}
        <form onSubmit={handleSubmit} className="relative">
          <input 
            type="text" 
            placeholder="Add item"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            autoCapitalize="sentences"
            className="w-full pl-4 lg:pl-5 pr-10 lg:pr-12 py-2.5 lg:py-3.5 bg-m3-surface-variant/20 border border-m3-outline/10 rounded-xl lg:rounded-2xl outline-none focus:border-m3-primary font-bold text-sm"
          />
          <button 
            type="submit"
            className="absolute right-1.5 lg:right-2 top-1/2 -translate-y-1/2 p-1.5 lg:p-2 bg-m3-primary text-m3-on-primary rounded-lg lg:rounded-xl shadow-sm hover:scale-110 active:scale-95 transition-all"
          >
            <Plus size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};