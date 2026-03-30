import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { Zzz } from '../components/ui/icons';
import { Recipe } from '../types';

interface RecipePageProps {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
}

export const RecipePage: React.FC<RecipePageProps> = ({ recipes, onEdit, onDelete }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const recipe = recipes.find(r => r.id === id);

  if (!recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-m3-surface p-4">
        <h2 className="text-2xl font-bold text-m3-on-surface mb-4">Recipe not found</h2>
        <button 
          onClick={() => navigate('/recipes')}
          className="px-6 py-2 bg-m3-primary text-m3-on-primary rounded-xl font-semibold hover:bg-m3-primary/90 transition-colors"
        >
          Back to Recipes
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
            onClick={() => navigate('/recipes')}
            className="p-3 bg-m3-surface/80 hover:bg-m3-surface text-m3-on-surface rounded-full shadow-lg transition-colors flex items-center gap-2 pr-5"
            title="Back to Recipes"
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
            className="p-3 bg-m3-surface/80 hover:bg-m3-surface text-red-600 rounded-full shadow-lg transition-colors"
            title="Delete Recipe"
          >
            <Trash2 size={20} />
          </button>
          {recipe.sourceUrl && (
            <a 
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-m3-surface/80 hover:bg-m3-surface text-m3-on-surface rounded-full shadow-lg transition-colors"
              title="View Original"
            >
              <ExternalLink size={20} />
            </a>
          )}
        </div>
      </div>

      <div className="px-6 py-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black text-m3-on-surface mb-4 leading-tight">{recipe.title}</h1>
        </div>

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-m3-on-surface mb-6">Ingredients</h2>
            <div className="grid gap-3">
              {recipe.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-m3-surface-container rounded-2xl">
                  <div className="w-6 h-6 border-2 border-m3-outline rounded-lg" />
                  <span className="text-m3-on-surface font-medium">
                    {typeof ingredient === 'string' ? ingredient : `${ingredient.amount || ''} ${ingredient.unit || ''} ${ingredient.name}`.trim()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {recipe.instructions && (
          <div>
            <h2 className="text-2xl font-bold text-m3-on-surface mb-6">Instructions</h2>
            <div className="prose prose-lg max-w-none">
              <div className="text-m3-on-surface leading-relaxed whitespace-pre-wrap">
                {recipe.instructions}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};