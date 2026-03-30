import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  Timestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { extractRecipeFromUrl, Ingredient } from '../services/geminiService';
import { 
  ArrowLeft,
  Plus, 
  Check,
  Scissors,
  Loader2
} from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import TextareaAutosize from 'react-textarea-autosize';

// Import components
import { IngredientItem } from '../components/recipe/IngredientItem';

// Import types and utils
import { UNIT_CONVERSIONS } from '../constants/units';
import { handleFirestoreError as baseHandleFirestoreError } from '../utils/firestore';
import { OperationType } from '../types';

interface AddRecipePageProps {
  user: User;
  onMenuClick: () => void;
}

export const AddRecipePage: React.FC<AddRecipePageProps> = ({ user, onMenuClick }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get('mode') as 'manual' | 'url') || 'manual';
  const [mode, setMode] = useState<'manual' | 'url'>(initialMode);
  const [urlInput, setUrlInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    instructions: string;
    imageUrl: string;
    sourceUrl: string;
  }>({
    title: '',
    instructions: '',
    imageUrl: '',
    sourceUrl: ''
  });
  
  const [ingredients, setIngredients] = useState<{ id: string; amount: string; unit: string; name: string }[]>([
    { id: Math.random().toString(36).substr(2, 9), amount: '', unit: '', name: '' }
  ]);
  
  const [isSaving, setIsSaving] = useState(false);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput || !user) return;

    setIsExtracting(true);
    try {
      const extracted = await extractRecipeFromUrl(urlInput);
      
      // Pre-populate the form with extracted data
      setForm({
        title: extracted.title,
        instructions: extracted.instructions,
        imageUrl: extracted.imageUrl || '',
        sourceUrl: urlInput
      });
      
      setIngredients(extracted.ingredients.map(ing => {
        if (typeof ing === 'string') {
          return { id: Math.random().toString(36).substr(2, 9), amount: '', unit: '', name: ing };
        }
        return { id: Math.random().toString(36).substr(2, 9), ...ing };
      }));
      
      // Switch to manual mode to allow editing
      setMode('manual');
      setUrlInput('');
    } catch (error) {
      if (error instanceof Error && error.message.includes('API key')) {
        alert(`${error.message}\n\nYou can get a free API key from Google AI Studio and add it in Settings.`);
      } else {
        console.error("Extraction error:", error);
        alert("Failed to extract recipe. Please check the URL and try again. If the issue persists, verify your API key in Settings.");
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title) return;

    const finalIngredients = ingredients
      .filter(ing => ing.name.trim() !== '')
      .map(({ id, ...rest }) => rest);

    setIsSaving(true);
    try {
      const recipeData: any = {
        title: form.title,
        ingredients: finalIngredients,
        instructions: form.instructions || '',
        userId: user.uid,
        createdAt: Timestamp.now()
      };

      // Only add optional fields if they have values
      if (form.imageUrl && form.imageUrl.trim()) {
        recipeData.imageUrl = form.imageUrl.trim();
      }
      if (form.sourceUrl && form.sourceUrl.trim()) {
        recipeData.sourceUrl = form.sourceUrl.trim();
      }

      await addDoc(collection(db, 'recipes'), recipeData);
      navigate('/');
    } catch (error) {
      console.error('Error creating recipe:', error);
      baseHandleFirestoreError(error, OperationType.CREATE, 'recipes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvert = (index: number, targetUnit: string) => {
    const ing = ingredients[index];
    if (!ing.unit || !targetUnit || !UNIT_CONVERSIONS[ing.unit]?.[targetUnit]) return;

    // Handle fractions or decimals
    let numericAmount = 0;
    if (ing.amount.includes('/')) {
      const [num, den] = ing.amount.split('/').map(Number);
      numericAmount = num / den;
    } else {
      numericAmount = parseFloat(ing.amount);
    }

    if (isNaN(numericAmount)) return;

    const convertedAmount = numericAmount * UNIT_CONVERSIONS[ing.unit][targetUnit];
    const roundedAmount = Math.round(convertedAmount * 100) / 100;

    const newIngs = [...ingredients];
    newIngs[index] = { ...ing, amount: roundedAmount.toString(), unit: targetUnit };
    setIngredients(newIngs);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-m3-surface flex flex-col"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-m3-surface/80 backdrop-blur-md border-b border-m3-outline/10 px-4 py-4 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/recipes')}
              className="p-3 bg-m3-surface-variant/20 hover:bg-m3-surface-variant/30 text-m3-on-surface rounded-full transition-colors"
              title="Back to Recipes"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-black tracking-tight text-m3-on-surface">
              {mode === 'url' ? 'Add from URL' : 'Add New Recipe'}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-8 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {mode === 'url' ? (
            /* URL Extraction Mode */
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-m3-primary text-m3-on-primary rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Scissors size={40} />
                </div>
                <h2 className="text-3xl font-bold text-m3-on-surface mb-3">AI Recipe Clipper</h2>
                <p className="text-m3-on-surface-variant text-lg font-medium max-w-2xl mx-auto">
                  Paste any recipe URL and our AI will extract the details for you.
                </p>
              </div>

              <form onSubmit={handleExtract} className="space-y-6 max-w-2xl mx-auto">
                <div className="space-y-4">
                  <label className="block text-xs font-black text-m3-primary uppercase tracking-[0.2em]">Recipe URL</label>
                  <input 
                    type="url" 
                    required
                    placeholder="https://example.com/delicious-recipe"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className="w-full px-8 py-5 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-[24px] text-m3-on-surface placeholder:text-m3-on-surface-variant/50 focus:ring-2 focus:ring-m3-primary/30 outline-none transition-all text-lg shadow-inner"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isExtracting}
                  className="w-full py-5 bg-m3-primary text-m3-on-primary rounded-[24px] font-black hover:bg-m3-primary/90 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 text-xl"
                >
                  {isExtracting ? <Loader2 className="animate-spin" size={24} /> : <Scissors size={24} />}
                  {isExtracting ? 'Extracting Recipe...' : 'Extract Recipe'}
                </button>
              </form>
              
              <div className="space-y-3 text-center max-w-2xl mx-auto">
                <p className="text-sm text-m3-on-surface-variant/60">
                  Works with NYT Cooking, AllRecipes, Food Network, and many more recipe sites.
                </p>
                <p className="text-xs text-m3-on-surface-variant/50">
                  Requires a free Gemini API key. Add yours in Settings → API Configuration.
                </p>
              </div>
            </div>
          ) : (
            /* Manual Entry Mode */
            <form onSubmit={handleSave} className="space-y-10">
            <div className="space-y-4">
              <label className="block text-xs font-black text-m3-primary uppercase tracking-[0.2em]">Recipe Title</label>
              <TextareaAutosize 
                required
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full px-6 py-4 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-[20px] focus:bg-m3-surface-variant/30 focus:ring-2 focus:ring-m3-primary/20 focus:border-m3-primary outline-none resize-none text-xl font-bold text-m3-on-surface transition-all"
                minRows={1}
                placeholder="Enter recipe title..."
              />
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-m3-primary uppercase tracking-[0.2em]">Image URL (Optional)</label>
              <TextareaAutosize 
                value={form.imageUrl}
                onChange={e => setForm({...form, imageUrl: e.target.value})}
                className="w-full px-6 py-4 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-[20px] focus:bg-m3-surface-variant/30 focus:ring-2 focus:ring-m3-primary/20 focus:border-m3-primary outline-none resize-none text-m3-on-surface transition-all font-medium"
                minRows={1}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-m3-primary uppercase tracking-[0.2em]">Ingredients</label>
                <button 
                  type="button"
                  onClick={() => setIngredients([...ingredients, { id: Math.random().toString(36).substr(2, 9), amount: '', unit: '', name: '' }])}
                  className="text-sm text-m3-primary font-black hover:bg-m3-primary/10 px-4 py-2 rounded-full flex items-center gap-2 transition-all"
                >
                  <Plus size={18} /> Add Item
                </button>
              </div>
              
              <Reorder.Group 
                axis="y" 
                values={ingredients} 
                onReorder={setIngredients}
                className="space-y-3"
              >
                {ingredients.map((ing, i) => (
                  <IngredientItem 
                    key={ing.id}
                    ing={ing}
                    index={i}
                    onUpdate={(idx, fieldOrObject, value?) => {
                      console.log('onUpdate called with:', idx, fieldOrObject, value);
                      const newIngs = [...ingredients];
                      if (typeof fieldOrObject === 'object') {
                        // Batch update with multiple fields
                        newIngs[idx] = { ...newIngs[idx], ...fieldOrObject };
                        console.log('Batch updating ingredient at index', idx, 'with:', fieldOrObject);
                      } else {
                        // Single field update
                        newIngs[idx] = { ...newIngs[idx], [fieldOrObject]: value };
                        console.log('Single field update at index', idx, 'field:', fieldOrObject, 'value:', value);
                      }
                      setIngredients(newIngs);
                      console.log('New ingredients state:', newIngs[idx]);
                    }}
                    onRemove={(id) => {
                      setIngredients(ingredients.filter(item => item.id !== id));
                    }}
                    onConvert={handleConvert}
                  />
                ))}
              </Reorder.Group>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-m3-primary uppercase tracking-[0.2em]">Instructions (Markdown)</label>
              <textarea 
                rows={10}
                required
                value={form.instructions}
                onChange={e => setForm({...form, instructions: e.target.value})}
                className="w-full px-6 py-5 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-[24px] focus:bg-m3-surface-variant/30 focus:ring-2 focus:ring-m3-primary/20 focus:border-m3-primary outline-none resize-none text-m3-on-surface transition-all font-medium leading-relaxed"
                placeholder="1. Preheat oven to 350°F...&#10;2. Mix ingredients...&#10;3. Bake for 25 minutes..."
              />
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-m3-primary uppercase tracking-[0.2em]">Source URL (Optional)</label>
              <TextareaAutosize 
                value={form.sourceUrl}
                onChange={e => setForm({...form, sourceUrl: e.target.value})}
                className="w-full px-6 py-4 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-[20px] focus:bg-m3-surface-variant/30 focus:ring-2 focus:ring-m3-primary/20 focus:border-m3-primary outline-none resize-none text-m3-on-surface transition-all font-medium"
                minRows={1}
                placeholder="https://example.com/original-recipe"
              />
            </div>

            <div className="flex gap-4 pt-8 border-t border-m3-outline/10">
              <button 
                type="button"
                onClick={() => navigate('/recipes')}
                className="flex-[0.4] py-2.5 px-6 border border-m3-outline text-m3-primary rounded-[20px] font-medium hover:bg-m3-primary/8 transition-all"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-[0.6] py-2.5 px-6 bg-m3-primary text-m3-on-primary rounded-[20px] font-medium hover:bg-m3-primary/90 transition-all shadow-sm hover:shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? 'Creating Recipe...' : 'Create Recipe'}
              </button>
            </div>
            </form>
          )}
        </div>
      </main>
    </motion.div>
  );
};