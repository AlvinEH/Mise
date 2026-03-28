import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, UtensilsCrossed, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, subDays, isSameDay, startOfDay } from 'date-fns';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { PageHeader } from '../components/layout/PageHeader';
import { MealEntry } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestore';

interface MealPlannerPageProps {
  onMenuClick: () => void;
}

interface DayMeals {
  lunch?: MealEntry;
  dinner?: MealEntry;
}

export const MealPlannerPage = ({ onMenuClick }: MealPlannerPageProps) => {
  const [user] = useAuthState(auth);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [isAddingMeal, setIsAddingMeal] = useState<{ date: string; type: 'lunch' | 'dinner' } | null>(null);
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);
  const [newMealName, setNewMealName] = useState('');
  const [newMealNotes, setNewMealNotes] = useState('');
  const todayRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate 30 days (7 days ago to 23 days ahead) for a good scrolling range
  const days = Array.from({ length: 30 }, (_, i) => addDays(subDays(startOfDay(new Date()), 7), i));

  // Group meals by date
  const mealsByDate = meals.reduce((acc, meal) => {
    if (!acc[meal.date]) {
      acc[meal.date] = {};
    }
    acc[meal.date][meal.type] = meal;
    return acc;
  }, {} as Record<string, DayMeals>);

  useEffect(() => {
    if (!user) return;

    const rangeStart = format(days[0], 'yyyy-MM-dd');
    const rangeEnd = format(days[days.length - 1], 'yyyy-MM-dd');

    const q = query(
      collection(db, 'mealEntries'),
      where('userId', '==', user.uid),
      where('date', '>=', rangeStart),
      where('date', '<=', rangeEnd),
      orderBy('date'),
      orderBy('type')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mealData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MealEntry));
      setMeals(mealData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'mealEntries');
    });

    return unsubscribe;
  }, [user]);

  // Scroll to today on initial load and when meals are loaded
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [meals.length > 0]); 

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealName.trim() || !isAddingMeal || !user) return;

    try {
      const mealData: any = {
        userId: user.uid,
        date: isAddingMeal.date,
        type: isAddingMeal.type,
        recipeName: newMealName.trim(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (newMealNotes.trim()) {
        mealData.notes = newMealNotes.trim();
      }

      await addDoc(collection(db, 'mealEntries'), mealData);
      setNewMealName('');
      setNewMealNotes('');
      setIsAddingMeal(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'mealEntries');
    }
  };

  const handleEditMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealName.trim() || !editingMeal) return;

    try {
      const updateData: any = {
        recipeName: newMealName.trim(),
        updatedAt: Timestamp.now()
      };

      if (newMealNotes.trim()) {
        updateData.notes = newMealNotes.trim();
      } else {
        updateData.notes = null;
      }

      await updateDoc(doc(db, 'mealEntries', editingMeal.id), updateData);
      setNewMealName('');
      setNewMealNotes('');
      setEditingMeal(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'mealEntries/' + editingMeal.id);
    }
  };

  const handleDeleteMeal = async (meal: MealEntry) => {
    if (!window.confirm(`Delete ${meal.recipeName || 'this meal'}?`)) return;
    
    try {
      await deleteDoc(doc(db, 'mealEntries', meal.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'mealEntries/' + meal.id);
    }
  };

  const startAddingMeal = (date: string, type: 'lunch' | 'dinner') => {
    setIsAddingMeal({ date, type });
    setNewMealName('');
    setNewMealNotes('');
  };

  const startEditingMeal = (meal: MealEntry) => {
    setEditingMeal(meal);
    setNewMealName(meal.recipeName || '');
    setNewMealNotes(meal.notes || '');
  };

  const cancelEdit = () => {
    setIsAddingMeal(null);
    setEditingMeal(null);
    setNewMealName('');
    setNewMealNotes('');
  };

  const scrollToToday = () => {
    todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <PageHeader title="Meal Planner" onMenuClick={onMenuClick} />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <UtensilsCrossed size={64} className="mx-auto mb-6 text-m3-on-surface-variant/30" />
            <p className="text-xl font-bold text-m3-on-surface-variant">Please sign in to plan your meals</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-m3-surface">
      <PageHeader title="Meal Planner" onMenuClick={onMenuClick} />
      
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Agenda Header */}
        <div className="px-6 py-6 flex items-center justify-between bg-m3-surface z-10">
          <div>
            <h1 className="text-3xl font-semibold text-m3-on-surface tracking-tight">
              Agenda
            </h1>
            <p className="text-sm text-m3-on-surface-variant">
              Your weekly meal schedule
            </p>
          </div>
          <button 
            onClick={scrollToToday}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-m3-primary text-m3-on-primary font-medium text-sm hover:shadow-md transition-all active:scale-95"
          >
            <CalendarIcon size={18} />
            Today
          </button>
        </div>

        {/* Scrolling Agenda View */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          <div className="max-w-4xl mx-auto py-6 md:py-12 px-4 md:px-6">
            <div className="space-y-3 md:space-y-4">
              {days.map((date) => {
                const dateString = format(date, 'yyyy-MM-dd');
                const dayMeals = mealsByDate[dateString] || {};
                const isToday = isSameDay(date, new Date());
                
                return (
                  <div 
                    key={dateString}
                    ref={isToday ? todayRef : null}
                    className={`group relative grid grid-cols-[48px_1fr] md:grid-cols-[80px_1fr] gap-3 md:gap-6 p-3 md:p-6 rounded-[28px] transition-all duration-300 ${
                      isToday 
                        ? 'bg-m3-primary-container text-m3-on-primary-container shadow-sm' 
                        : 'bg-m3-surface-container-low border border-m3-outline-variant/30 hover:bg-m3-surface-container'
                    }`}
                  >
                    {/* Date Column */}
                    <div className="flex flex-col items-center justify-center text-center border-r border-m3-outline-variant/50 pr-3 md:pr-6">
                      <span className={`text-[10px] md:text-xs font-medium mb-1 ${
                        isToday ? 'text-m3-on-primary-container/70' : 'text-m3-on-surface-variant'
                      }`}>
                        {format(date, 'EEE')}
                      </span>
                      <span className="text-xl md:text-3xl font-bold tracking-tight leading-none">
                        {format(date, 'd')}
                      </span>
                      <span className={`text-[10px] md:text-xs font-medium mt-1 ${
                        isToday ? 'text-m3-on-primary-container/70' : 'text-m3-on-surface-variant'
                      }`}>
                        {format(date, 'MMM')}
                      </span>
                    </div>

                    {/* Meals Column */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {/* Lunch Slot */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold tracking-wide ${
                            isToday ? 'text-m3-on-primary-container/60' : 'text-m3-on-surface-variant/70'
                          }`}>LUNCH</span>
                          {!dayMeals.lunch && (
                            <button
                              onClick={() => startAddingMeal(dateString, 'lunch')}
                              className={`p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                                isToday ? 'hover:bg-m3-on-primary-container/10 text-m3-on-primary-container' : 'hover:bg-m3-primary/10 text-m3-primary'
                              }`}
                            >
                              <Plus size={18} />
                            </button>
                          )}
                        </div>
                        
                        {dayMeals.lunch ? (
                          <div className={`relative p-4 rounded-2xl transition-all group/item ${
                            isToday ? 'bg-m3-on-primary-container/5 hover:bg-m3-on-primary-container/10' : 'bg-m3-surface-container-high hover:bg-m3-surface-container-highest'
                          }`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="font-semibold text-lg leading-tight mb-0.5 truncate">
                                  {dayMeals.lunch.recipeName}
                                </h4>
                                {dayMeals.lunch.notes && (
                                  <p className={`text-sm line-clamp-1 ${
                                    isToday ? 'text-m3-on-primary-container/70' : 'text-m3-on-surface-variant'
                                  }`}>
                                    {dayMeals.lunch.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditingMeal(dayMeals.lunch!)}
                                  className={`p-2 rounded-full transition-all ${
                                    isToday ? 'hover:bg-m3-on-primary-container/10 text-m3-on-primary-container' : 'hover:bg-m3-primary/10 text-m3-primary'
                                  }`}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteMeal(dayMeals.lunch!)}
                                  className={`p-2 rounded-full transition-all ${
                                    isToday ? 'hover:bg-m3-error-container/20 text-m3-error' : 'hover:bg-m3-error/10 text-m3-error'
                                  }`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => startAddingMeal(dateString, 'lunch')}
                            className={`w-full py-3 border border-m3-outline-variant/50 border-dashed rounded-2xl text-xs font-medium transition-all ${
                              isToday 
                                ? 'text-m3-on-primary-container/40 hover:bg-m3-on-primary-container/5 hover:border-m3-on-primary-container/30' 
                                : 'text-m3-on-surface-variant/40 hover:bg-m3-primary/5 hover:border-m3-primary/30 hover:text-m3-primary'
                            }`}
                          >
                            Plan Lunch
                          </button>
                        )}
                      </div>

                      {/* Dinner Slot */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold tracking-wide ${
                            isToday ? 'text-m3-on-primary-container/60' : 'text-m3-on-surface-variant/70'
                          }`}>DINNER</span>
                          {!dayMeals.dinner && (
                            <button
                              onClick={() => startAddingMeal(dateString, 'dinner')}
                              className={`p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                                isToday ? 'hover:bg-m3-on-primary-container/10 text-m3-on-primary-container' : 'hover:bg-m3-primary/10 text-m3-primary'
                              }`}
                            >
                              <Plus size={18} />
                            </button>
                          )}
                        </div>
                        
                        {dayMeals.dinner ? (
                          <div className={`relative p-4 rounded-2xl transition-all group/item ${
                            isToday ? 'bg-m3-on-primary-container/5 hover:bg-m3-on-primary-container/10' : 'bg-m3-surface-container-high hover:bg-m3-surface-container-highest'
                          }`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="font-semibold text-lg leading-tight mb-0.5 truncate">
                                  {dayMeals.dinner.recipeName}
                                </h4>
                                {dayMeals.dinner.notes && (
                                  <p className={`text-sm line-clamp-1 ${
                                    isToday ? 'text-m3-on-primary-container/70' : 'text-m3-on-surface-variant'
                                  }`}>
                                    {dayMeals.dinner.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditingMeal(dayMeals.dinner!)}
                                  className={`p-2 rounded-full transition-all ${
                                    isToday ? 'hover:bg-m3-on-primary-container/10 text-m3-on-primary-container' : 'hover:bg-m3-primary/10 text-m3-primary'
                                  }`}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteMeal(dayMeals.dinner!)}
                                  className={`p-2 rounded-full transition-all ${
                                    isToday ? 'hover:bg-m3-error-container/20 text-m3-error' : 'hover:bg-m3-error/10 text-m3-error'
                                  }`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => startAddingMeal(dateString, 'dinner')}
                            className={`w-full py-3 border border-m3-outline-variant/50 border-dashed rounded-2xl text-xs font-medium transition-all ${
                              isToday 
                                ? 'text-m3-on-primary-container/40 hover:bg-m3-on-primary-container/5 hover:border-m3-on-primary-container/30' 
                                : 'text-m3-on-surface-variant/40 hover:bg-m3-primary/5 hover:border-m3-primary/30 hover:text-m3-primary'
                            }`}
                          >
                            Plan Dinner
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Meal Modal */}
      <AnimatePresence>
        {(isAddingMeal || editingMeal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-m3-surface/80 backdrop-blur-xl flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) cancelEdit();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-m3-surface-container-high rounded-[28px] p-6 md:p-8 w-full max-w-lg shadow-xl border border-m3-outline-variant/20"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-m3-on-surface tracking-tight">
                  {editingMeal ? 'Edit Meal' : `Add ${isAddingMeal?.type}`}
                </h3>
                <p className="text-sm text-m3-on-surface-variant mt-1">
                  {editingMeal ? 'Update your meal details' : 'Plan what to eat for this slot'}
                </p>
              </div>
              
              <form onSubmit={editingMeal ? handleEditMeal : handleAddMeal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-m3-on-surface-variant mb-2 ml-1">
                    Meal Name
                  </label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Grilled Salmon with Asparagus"
                    value={newMealName}
                    onChange={e => setNewMealName(e.target.value)}
                    className="w-full px-4 py-3 bg-m3-surface-container rounded-2xl outline-none border-2 border-transparent focus:border-m3-primary/50 transition-all font-medium"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-m3-on-surface-variant mb-2 ml-1">
                    Notes
                  </label>
                  <textarea
                    placeholder="Add any details or ingredients..."
                    value={newMealNotes}
                    onChange={e => setNewMealNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-m3-surface-container rounded-2xl outline-none border-2 border-transparent focus:border-m3-primary/50 transition-all font-medium resize-none"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 px-6 py-2.5 rounded-full font-medium text-sm text-m3-primary hover:bg-m3-primary/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2.5 bg-m3-primary text-m3-on-primary rounded-full font-medium text-sm shadow-sm hover:shadow-md transition-all active:scale-95"
                  >
                    {editingMeal ? 'Save' : 'Add to Plan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
