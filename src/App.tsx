import React, { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDoc,
  updateDoc,
  Timestamp,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, signIn, logOut } from './firebase';
import { 
  Routes, 
  Route, 
  useNavigate, 
  useParams, 
  Link,
  NavLink,
  useLocation
} from 'react-router-dom';
import { 
  Sun,
  Palette,
  Search, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  LogOut, 
  LogIn,
  X,
  Clock,
  UtensilsCrossed,
  Edit2,
  GripVertical,
  Check,
  ArrowUpDown,
  ArrowLeft,
  ShoppingCart,
  Calendar,
  Settings,
  Menu,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';

// Import extracted components
import { PageHeader } from './components/layout/PageHeader';
import { Sidebar } from './components/layout/Sidebar';
import { RecipeCard } from './components/recipe/RecipeCard';
import { IngredientItem } from './components/recipe/IngredientItem';
import { StoreCard } from './components/shopping/StoreCard';
import { ShoppingListContent } from './components/shopping/ShoppingListContent';
import { Zzz } from './components/ui/icons';

// Import extracted pages
import { MealPlannerPage } from './pages/MealPlannerPage';
import { SettingsPage } from './pages/SettingsPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { AddRecipePage } from './pages/AddRecipePage';
import { InventoryPage } from './pages/InventoryPage';

// Import types and constants
import { 
  Recipe, 
  StoreList, 
  ShoppingItem, 
  Theme, 
  Mode, 
  OperationType, 
  FirestoreErrorInfo 
} from './types';
import { COMMON_UNITS, UNIT_CONVERSIONS } from './constants/units';
import { formatIngredient } from './utils/ingredients';
import { handleFirestoreError as baseHandleFirestoreError } from './utils/firestore';

// --- Error Handling ---

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          message = "You don't have permission to perform this action. Please check your account settings.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <X size={32} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Application Error</h2>
            <p className="text-zinc-500 mb-6">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Components ---


// ShoppingListPage removed - using imported version

const RecipePage = ({ recipes, onEdit, onDelete }: { recipes: Recipe[], onEdit: (recipe: Recipe) => void, onDelete: (recipe: Recipe) => void }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const recipe = recipes.find(r => r.id === id);

  if (!recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-m3-surface p-4">
        <h2 className="text-2xl font-bold text-m3-on-surface mb-4">Recipe not found</h2>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-m3-primary text-m3-on-primary rounded-xl font-semibold hover:bg-m3-primary/90 transition-colors"
        >
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-m3-surface"
    >
      <div className="relative h-72 sm:h-96 shrink-0">
        {recipe.imageUrl ? (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-m3-surface-variant flex items-center justify-center text-m3-on-surface-variant/30">
            <Zzz size={80} />
          </div>
        )}
        <div className="absolute top-6 left-6">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-m3-surface/80 hover:bg-m3-surface text-m3-on-surface rounded-full shadow-lg transition-colors flex items-center gap-2 pr-5"
            title="Back to Library"
          >
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className="absolute top-6 right-6 flex gap-3">
          <button 
            onClick={() => onEdit(recipe)}
            className="p-3 bg-m3-surface/80 hover:bg-m3-surface text-m3-on-surface rounded-full shadow-lg transition-colors"
            title="Edit Recipe"
          >
            <Edit2 size={20} />
          </button>
          <button 
            onClick={() => onDelete(recipe)}
            className="p-3 bg-red-50/80 hover:bg-red-50 text-red-600 rounded-full shadow-lg transition-colors"
            title="Delete Recipe"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-8 sm:p-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-m3-on-surface tracking-tight">{recipe.title}</h2>
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-m3-primary/10 text-m3-primary text-xs font-bold rounded-full uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          {recipe.sourceUrl && (
            <a 
              href={recipe.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-m3-primary-container text-m3-on-primary-container rounded-full font-bold hover:bg-m3-primary-container/80 transition-colors"
            >
              Original Recipe <ExternalLink size={18} />
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-1">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-m3-primary mb-6 flex items-center gap-2">
              <UtensilsCrossed size={18} /> Ingredients
            </h3>
            <ul className="space-y-4">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="text-m3-on-surface text-base border-b border-m3-outline/10 pb-3 flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-m3-primary mt-2 shrink-0" />
                  {formatIngredient(ing)}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-m3-primary mb-6">Instructions</h3>
            <div className="prose prose-m3 max-w-none prose-sm sm:prose-base text-m3-on-surface">
              <ReactMarkdown>{recipe.instructions}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Recipe>>({});
  const [editIngredients, setEditIngredients] = useState<{ id: string; amount: string; unit: string; name: string }[]>([]);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alpha'>('newest');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('glazy-theme') as Theme) || 'm3');
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('glazy-mode') as Mode) || 'light');

  useEffect(() => {
    const themeValue = theme === 'm3' ? (mode === 'light' ? '' : 'm3-dark') : `${theme}-${mode}`;
    document.documentElement.setAttribute('data-theme', themeValue);
    localStorage.setItem('glazy-theme', theme);
    localStorage.setItem('glazy-mode', mode);
  }, [theme, mode]);

  const navigate = useNavigate();
  const location = useLocation();

  const isRecipeDetailPage = location.pathname.startsWith('/recipe/');

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        // Ensure user doc exists
        const userRef = doc(db, 'users', u.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: u.email,
              displayName: u.displayName,
              photoURL: u.photoURL,
              role: 'user'
            });
          }
        } catch (error) {
          baseHandleFirestoreError(error, OperationType.WRITE, 'users/' + u.uid);
        }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setRecipes([]);
      return;
    }

    const q = query(
      collection(db, 'recipes'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Recipe));
      setRecipes(docs);
    }, (error) => {
      baseHandleFirestoreError(error, OperationType.LIST, 'recipes');
    });

    return unsubscribe;
  }, [user]);

  const filteredRecipes = useMemo(() => {
    let result = recipes;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = recipes.filter(r => 
        r.title.toLowerCase().includes(lowerQuery) || 
        r.ingredients.some(ing => formatIngredient(ing).toLowerCase().includes(lowerQuery))
      );
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'alpha') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'oldest') {
        return a.createdAt.toMillis() - b.createdAt.toMillis();
      } else {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
    });
  }, [recipes, searchQuery, sortBy]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'recipes', id));
      setRecipeToDelete(null);
      // If we're on the recipe page, navigate back to library
      if (window.location.pathname.includes(`/recipe/${id}`)) {
        navigate('/');
      }
    } catch (error) {
      baseHandleFirestoreError(error, OperationType.DELETE, 'recipes/' + id);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editForm.title) return;

    const finalIngredients = editIngredients
      .filter(ing => ing.name.trim() !== '')
      .map(({ id, ...rest }) => rest);

    try {
      if (editForm.id) {
        const updateData: any = {
          title: editForm.title,
          ingredients: finalIngredients,
          instructions: editForm.instructions || ''
        };

        // Only add optional fields if they have values
        if (editForm.imageUrl && editForm.imageUrl.trim()) {
          updateData.imageUrl = editForm.imageUrl.trim();
        }
        if (editForm.sourceUrl && editForm.sourceUrl.trim()) {
          updateData.sourceUrl = editForm.sourceUrl.trim();
        }

        await updateDoc(doc(db, 'recipes', editForm.id), updateData);
      }
      setIsEditing(false);
      setEditForm({});
      setEditIngredients([]);
    } catch (error) {
      console.error('Error updating recipe:', error);
      baseHandleFirestoreError(error, OperationType.UPDATE, 'recipes');
    }
  };



  const startEdit = (recipe: Recipe) => {
    setEditForm(recipe);
    setEditIngredients(recipe.ingredients.map(ing => {
      if (typeof ing === 'string') {
        return { id: Math.random().toString(36).substr(2, 9), amount: '', unit: '', name: ing };
      }
      return { id: Math.random().toString(36).substr(2, 9), ...ing };
    }));
    setIsEditing(true);
  };

  const handleConvert = (index: number, targetUnit: string) => {
    const ing = editIngredients[index];
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

    const newIngs = [...editIngredients];
    newIngs[index] = { ...ing, amount: roundedAmount.toString(), unit: targetUnit };
    setEditIngredients(newIngs);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-m3-surface p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-m3-primary-container text-m3-on-primary-container rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Zzz size={48} />
          </div>
          <h1 className="text-5xl font-black text-m3-on-surface mb-4 tracking-tight">Glazy</h1>
          <p className="text-m3-on-surface-variant mb-12 text-xl font-medium leading-relaxed">
            Clip recipes from any website instantly using AI. Save your favorites and search them anytime.
          </p>
          <button 
            onClick={signIn}
            className="w-full py-5 px-8 bg-m3-primary text-m3-on-primary rounded-[24px] font-black flex items-center justify-center gap-4 hover:bg-m3-primary/90 transition-all shadow-xl hover:shadow-2xl active:scale-95"
          >
            <LogIn size={24} />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-m3-surface text-m3-on-surface font-sans selection:bg-m3-primary-container flex overflow-hidden">
      {!isRecipeDetailPage && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      )}

      <div className={`flex-1 flex flex-col ${isRecipeDetailPage ? 'min-h-screen' : 'h-screen overflow-hidden'} relative`}>
        <Routes>
          <Route path="/" element={
            <>
              {/* Top App Bar */}
              <header className="sticky top-0 z-40 bg-m3-surface/80 backdrop-blur-md border-b border-m3-outline/10 px-4 py-4 lg:px-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsSidebarOpen(true)}
                      className="p-3 lg:hidden text-m3-on-surface-variant hover:bg-m3-surface-variant/50 rounded-full transition-colors"
                    >
                      <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-3 lg:hidden">
                      <div className="p-2 bg-m3-primary text-m3-on-primary rounded-xl shadow-sm">
                        <Zzz size={20} />
                      </div>
                      <h1 className="text-xl font-black tracking-tight text-m3-on-surface">Glazy</h1>
                    </div>
                    <div className="hidden lg:block">
                      <h1 className="text-2xl font-black tracking-tight text-m3-on-surface">My Recipe Library</h1>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-4">
                      <div className="flex items-center gap-2 text-sm text-m3-on-surface">
                        <span className="font-bold">{user.displayName}</span>
                        <img src={user.photoURL || ''} className="w-9 h-9 rounded-full border border-m3-outline/20" alt="" />
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              <main className="flex-1 overflow-y-auto px-4 py-10 lg:px-12">
                <div className="max-w-7xl mx-auto">
                  {/* Search & Header Section */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-16">
                    <div className="text-center sm:text-left">
                      <h2 className="text-4xl sm:text-5xl font-black text-m3-on-surface tracking-tight mb-3">Explore</h2>
                      <p className="text-m3-on-surface-variant text-lg font-medium">Find your next favorite meal.</p>
                    </div>
                    
                    <div className="relative w-full sm:w-96">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-m3-on-surface-variant" size={20} />
                      <input 
                        type="text" 
                        placeholder="Search ingredients or titles..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-m3-surface-variant/20 border border-m3-outline/10 rounded-[24px] focus:bg-m3-surface-variant/30 focus:ring-2 focus:ring-m3-primary/20 focus:border-m3-primary outline-none transition-all font-medium text-lg"
                      />
                    </div>
                  </div>

                  {/* Recipe Grid */}
                  <section>
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-10 px-4 gap-4">
                      <h2 className="text-2xl font-bold text-m3-on-surface">Saved Recipes</h2>
                      <div className="flex items-center gap-4">
                        <div className="relative flex items-center bg-m3-surface-variant/20 border border-m3-outline/10 rounded-full px-4 py-1.5">
                          <ArrowUpDown size={14} className="text-m3-on-surface-variant mr-2" />
                          <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-transparent text-sm font-bold text-m3-on-surface-variant outline-none cursor-pointer appearance-none pr-4"
                          >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="alpha">Alphabetical</option>
                          </select>
                        </div>
                        <div className="px-5 py-2 bg-m3-secondary-container text-m3-on-secondary-container rounded-full text-sm font-black">
                          {filteredRecipes.length} Total
                        </div>
                      </div>
                    </div>

                    {filteredRecipes.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        <AnimatePresence mode="popLayout">
                          {filteredRecipes.map(recipe => (
                            <RecipeCard 
                              key={recipe.id} 
                              recipe={recipe} 
                              onDelete={(e) => {
                                e.stopPropagation();
                                setRecipeToDelete(recipe);
                              }}
                              onEdit={(e) => {
                                e.stopPropagation();
                                startEdit(recipe);
                              }}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="text-center py-32 bg-m3-surface-variant/10 rounded-[48px] border-2 border-dashed border-m3-outline/20">
                        <div className="w-24 h-24 bg-m3-surface-variant/30 text-m3-on-surface-variant/40 rounded-full flex items-center justify-center mx-auto mb-8">
                          <Search size={48} />
                        </div>
                        <h3 className="text-3xl font-bold text-m3-on-surface mb-3">No recipes found</h3>
                        <p className="text-m3-on-surface-variant text-lg font-medium">
                          {searchQuery ? "Try a different search term" : "Start by clipping your first recipe above!"}
                        </p>
                      </div>
                    )}
                  </section>
                </div>
              </main>

              {/* Floating Action Button */}
              <div className="fixed bottom-10 right-10 z-40">
                <button 
                  onClick={() => navigate('/add-recipe')}
                  className="w-20 h-20 bg-m3-primary-container text-m3-on-primary-container rounded-[28px] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                  title="Add New Recipe"
                >
                  <Plus size={40} />
                </button>
              </div>
            </>
          } />
          <Route path="/recipe/:id" element={<RecipePage recipes={recipes} onEdit={startEdit} onDelete={setRecipeToDelete} />} />
          <Route path="/add-recipe" element={<AddRecipePage user={user} onMenuClick={() => setIsSidebarOpen(true)} />} />
          <Route path="/inventory" element={<InventoryPage onMenuClick={() => setIsSidebarOpen(true)} />} />
          <Route path="/shopping-list" element={<ShoppingListPage onMenuClick={() => setIsSidebarOpen(true)} user={user} />} />
          <Route path="/meal-planner" element={<MealPlannerPage onMenuClick={() => setIsSidebarOpen(true)} />} />
          <Route path="/settings" element={
            <SettingsPage 
              onMenuClick={() => setIsSidebarOpen(true)} 
              user={user} 
              onLogout={logOut} 
              theme={theme}
              setTheme={setTheme}
              mode={mode}
              setMode={setMode}
            />
          } />
        </Routes>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {recipeToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setRecipeToDelete(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-m3-surface w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-m3-outline/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Trash2 size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-m3-on-surface">Delete Recipe?</h3>
                  <p className="text-m3-on-surface-variant font-medium">
                    Are you sure you want to delete <span className="font-bold text-m3-on-surface">"{recipeToDelete.title}"</span>? This action cannot be undone.
                  </p>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setRecipeToDelete(null)}
                    className="flex-1 py-4 bg-m3-surface-variant/20 text-m3-on-surface-variant rounded-2xl font-bold hover:bg-m3-surface-variant/30 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleDelete(recipeToDelete.id)}
                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit/Add Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-m3-surface w-full max-w-[98%] max-h-[98%] rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-m3-outline/10"
            >
              <div className="p-8 border-b border-m3-outline/10 flex justify-between items-center bg-m3-surface">
                <h2 className="text-2xl font-black text-m3-on-surface">Edit Recipe</h2>
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="p-3 hover:bg-m3-surface-variant/50 text-m3-on-surface-variant rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSaveEdit} className="p-8 sm:p-12 overflow-y-auto space-y-10 bg-m3-surface">
                <div className="space-y-4">
                  <label className="block text-xs font-black text-m3-primary uppercase tracking-[0.2em]">Recipe Title</label>
                  <TextareaAutosize 
                    required
                    value={editForm.title || ''}
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    className="w-full px-6 py-4 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-[20px] focus:bg-m3-surface-variant/30 focus:ring-2 focus:ring-m3-primary/20 focus:border-m3-primary outline-none resize-none text-xl font-bold text-m3-on-surface transition-all"
                    minRows={1}
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-black text-m3-primary uppercase tracking-[0.2em]">Image URL (Optional)</label>
                  <TextareaAutosize 
                    value={editForm.imageUrl || ''}
                    onChange={e => setEditForm({...editForm, imageUrl: e.target.value})}
                    className="w-full px-6 py-4 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-[20px] focus:bg-m3-surface-variant/30 focus:ring-2 focus:ring-m3-primary/20 focus:border-m3-primary outline-none resize-none text-m3-on-surface transition-all font-medium"
                    minRows={1}
                  />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-m3-primary uppercase tracking-[0.2em]">Ingredients</label>
                    <button 
                      type="button"
                      onClick={() => setEditIngredients([...editIngredients, { id: Math.random().toString(36).substr(2, 9), amount: '', unit: '', name: '' }])}
                      className="text-sm text-m3-primary font-black hover:bg-m3-primary/10 px-4 py-2 rounded-full flex items-center gap-2 transition-all"
                    >
                      <Plus size={18} /> Add Item
                    </button>
                  </div>
                  
                  <Reorder.Group 
                    axis="y" 
                    values={editIngredients} 
                    onReorder={setEditIngredients}
                    className="space-y-3"
                  >
                    {editIngredients.map((ing, i) => (
                      <IngredientItem 
                        key={ing.id}
                        ing={ing}
                        index={i}
                        onUpdate={(idx, fieldOrObject, value?) => {
                          console.log('onUpdate called with:', idx, fieldOrObject, value);
                          const newIngs = [...editIngredients];
                          if (typeof fieldOrObject === 'object') {
                            // Batch update with multiple fields
                            newIngs[idx] = { ...newIngs[idx], ...fieldOrObject };
                            console.log('Batch updating ingredient at index', idx, 'with:', fieldOrObject);
                          } else {
                            // Single field update
                            newIngs[idx] = { ...newIngs[idx], [fieldOrObject]: value };
                            console.log('Single field update at index', idx, 'field:', fieldOrObject, 'value:', value);
                          }
                          setEditIngredients(newIngs);
                          console.log('New editIngredients state:', newIngs[idx]);
                        }}
                        onRemove={(id) => {
                          setEditIngredients(editIngredients.filter(item => item.id !== id));
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
                    value={editForm.instructions || ''}
                    onChange={e => setEditForm({...editForm, instructions: e.target.value})}
                    className="w-full px-6 py-5 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-[24px] focus:bg-m3-surface-variant/30 focus:ring-2 focus:ring-m3-primary/20 focus:border-m3-primary outline-none resize-none text-m3-on-surface transition-all font-medium leading-relaxed"
                    placeholder="1. Preheat oven to 350°F..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-m3-outline/10">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-5 px-8 border-2 border-m3-outline text-m3-on-surface rounded-[24px] font-black hover:bg-m3-surface-variant/30 transition-all text-lg"
                  >
                    Discard Changes
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-5 px-8 bg-m3-primary text-m3-on-primary rounded-[24px] font-black hover:bg-m3-primary/90 transition-all shadow-xl hover:shadow-2xl text-lg flex items-center justify-center gap-3"
                  >
                    <Check size={24} />
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
