import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { Recipe, OperationType } from '../types';
import { handleFirestoreError } from '../utils/firestore';

export const useRecipes = (user: User | null) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Recipe>>({});
  const [editIngredients, setEditIngredients] = useState<{ id: string; amount: string; unit: string; name: string }[]>([]);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alpha'>('alpha');

  useEffect(() => {
    if (!user) {
      setRecipes([]);
      return;
    }

    const q = query(collection(db, 'recipes'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recipesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
      setRecipes(recipesData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'recipes'));

    return unsubscribe;
  }, [user?.uid]);

  const startEdit = useCallback((recipe: Recipe) => {
    setEditForm(recipe);
    setEditIngredients(
      recipe.ingredients?.map((ing, index) => ({
        id: `${index}`,
        amount: typeof ing === 'string' ? '' : (ing.amount || ''),
        unit: typeof ing === 'string' ? '' : (ing.unit || ''),
        name: typeof ing === 'string' ? ing : ing.name
      })) || []
    );
    setIsEditing(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditForm({});
    setEditIngredients([]);
  }, []);

  const handleDelete = useCallback(async (recipeId: string) => {
    try {
      await deleteDoc(doc(db, 'recipes', recipeId));
      setRecipeToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `recipes/${recipeId}`);
    }
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editForm.id || !user) return;

    const ingredients = editIngredients
      .filter(ing => ing.name.trim())
      .map(ing => ({
        amount: ing.amount.trim() || undefined,
        unit: ing.unit.trim() || undefined,
        name: ing.name.trim()
      }));

    try {
      await updateDoc(doc(db, 'recipes', editForm.id), {
        title: editForm.title?.trim(),
        instructions: editForm.instructions?.trim(),
        imageUrl: editForm.imageUrl?.trim(),
        sourceUrl: editForm.sourceUrl?.trim(),
        ingredients: ingredients.length > 0 ? ingredients : undefined,
        updatedAt: new Date()
      });
      cancelEdit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `recipes/${editForm.id}`);
    }
  }, [editForm.id, editForm.title, editForm.instructions, editForm.imageUrl, editForm.sourceUrl, editIngredients, user, cancelEdit]);

  return {
    recipes,
    isEditing,
    editForm,
    setEditForm,
    editIngredients,
    setEditIngredients,
    recipeToDelete,
    setRecipeToDelete,
    sortBy,
    setSortBy,
    startEdit,
    cancelEdit,
    handleDelete,
    handleSaveEdit
  };
};