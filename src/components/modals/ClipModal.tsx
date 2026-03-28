import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scissors, Plus, Loader2 } from 'lucide-react';

interface ClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  urlInput: string;
  setUrlInput: (val: string) => void;
  isExtracting: boolean;
  onExtract: (e: React.FormEvent) => void;
}

export const ClipModal = ({ 
  isOpen, 
  onClose, 
  urlInput, 
  setUrlInput, 
  isExtracting, 
  onExtract 
}: ClipModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-m3-surface w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-m3-outline/10"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-8 border-b border-m3-outline/10 flex justify-between items-center">
            <h2 className="text-2xl font-black text-m3-on-surface">AI Glazy</h2>
            <button 
              onClick={onClose} 
              className="p-3 hover:bg-m3-surface-variant/50 text-m3-on-surface-variant rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="p-10 space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-m3-primary text-m3-on-primary rounded-[20px] flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Scissors size={32} />
              </div>
              <p className="text-m3-on-surface-variant text-lg font-medium">Paste any recipe URL and our AI will extract the details for you.</p>
            </div>

            <form onSubmit={onExtract} className="space-y-6">
              <input 
                type="url" 
                required
                placeholder="https://example.com/delicious-recipe"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                className="w-full px-8 py-5 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-[24px] text-m3-on-surface placeholder:text-m3-on-surface-variant/50 focus:ring-2 focus:ring-m3-primary/30 outline-none transition-all text-lg shadow-inner"
              />
              <button 
                type="submit"
                disabled={isExtracting}
                className="w-full py-5 bg-m3-primary text-m3-on-primary rounded-[24px] font-black hover:bg-m3-primary/90 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 text-xl"
              >
                {isExtracting ? <Loader2 className="animate-spin" /> : <Plus />}
                {isExtracting ? 'Extracting...' : 'Clip Recipe'}
              </button>
            </form>
            
            <div className="space-y-3 text-center">
              <p className="text-sm text-m3-on-surface-variant/60">
                Works with NYT Cooking, AllRecipes, Food Network, and more.
              </p>
              <p className="text-xs text-m3-on-surface-variant/50">
                Requires a free Gemini API key. Add yours in Settings → API Configuration.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);