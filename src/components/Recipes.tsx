import { useState, useEffect } from 'react';
import { BookOpen } from '@phosphor-icons/react';
import { recipes } from '../data/recipes';
import type { Recipe } from '../types';
import './Recipes.css';

const FILTERS = [
  { id: 'all', label: 'Все', icon: '🌸' },
  { id: 'breakfast', label: 'Завтрак', icon: '🌅' },
  { id: 'lunch', label: 'Обед', icon: '🍝' },
  { id: 'dinner', label: 'Ужин', icon: '🍷' },
  { id: 'snack', label: 'Перекус', icon: '🥜' },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: '🌅 Завтрак',
  lunch: '🍝 Обед',
  dinner: '🍷 Ужин',
  snack: '🥜 Перекус',
};

function getDiary(): string[] {
  try {
    return JSON.parse(localStorage.getItem('recipe_diary') || '[]');
  } catch {
    return [];
  }
}

function saveDiary(ids: string[]) {
  localStorage.setItem('recipe_diary', JSON.stringify(ids));
}

export default function Recipes() {
  const [filter, setFilter] = useState('all');
  const [modalRecipe, setModalRecipe] = useState<Recipe | null>(null);
  const [toast, setToast] = useState('');
  const [diary, setDiary] = useState<string[]>(getDiary);

  useEffect(() => {
    setDiary(getDiary());
  }, []);

  const filtered = filter === 'all'
    ? recipes
    : recipes.filter(r => r.category === filter);

  const openModal = (recipe: Recipe) => setModalRecipe(recipe);
  const closeModal = () => setModalRecipe(null);

  const addToDiary = (id: string) => {
    if (diary.includes(id)) {
      showToast('🌸 Уже в твоём дневнике!');
      return;
    }
    const next = [...diary, id];
    setDiary(next);
    saveDiary(next);
    const recipe = recipes.find(r => r.id === id);
    showToast(`🍽️ «${recipe?.name}» добавлен в дневник!`);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div className="recipes">
      <div className="recipes-header">
        <h2 className="section-title">
          <BookOpen size={28} weight="fill" />
          Рецепты
          <span className="recipes-count">{filtered.length}</span>
        </h2>
        <div className="recipes-filters">
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`filter-btn ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="recipes-grid">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🧘</span>
            <p>Нет рецептов в этом разделе</p>
          </div>
        ) : (
          filtered.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onOpen={openModal}
              onAdd={addToDiary}
              inDiary={diary.includes(recipe.id)}
            />
          ))
        )}
      </div>

      {modalRecipe && (
        <RecipeModal
          recipe={modalRecipe}
          onClose={closeModal}
          onAdd={addToDiary}
          inDiary={diary.includes(modalRecipe.id)}
        />
      )}

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}

function RecipeCard({
  recipe,
  onOpen,
  onAdd,
  inDiary,
}: {
  recipe: Recipe;
  onOpen: (r: Recipe) => void;
  onAdd: (id: string) => void;
  inDiary: boolean;
}) {
  return (
    <div className="recipe-card">
      <div className="recipe-icon">{recipe.icon}</div>
      <div className="recipe-body">
        <div className="recipe-header">
          <h3 className="recipe-title">{recipe.name}</h3>
          <span className="recipe-badge">{CATEGORY_LABELS[recipe.category]}</span>
        </div>
        <div className="nutrition">
          <span className="n-item">🔥 {recipe.nutrition.calories}</span>
          <span className="n-item">🥩 {recipe.nutrition.protein}г</span>
          <span className="n-item">🧈 {recipe.nutrition.fat}г</span>
          <span className="n-item">🌾 {recipe.nutrition.carbs}г</span>
        </div>
        <div className="ingredients-line">
          {recipe.ingredients.map((ing, i) => (
            <span key={i} className="ingr">
              {ing.name} <span className="weight">{ing.weight}{ing.unit || 'г'}</span>
            </span>
          ))}
        </div>
        <div className="recipe-footer">
          <span className="time">⏱️ {recipe.time} мин</span>
          <button className="btn-detail" onClick={() => onOpen(recipe)}>
            📖 Подробнее
          </button>
        </div>
        <button
          className={`btn-add ${inDiary ? 'added' : ''}`}
          onClick={() => onAdd(recipe.id)}
        >
          {inDiary ? '✅ В дневнике' : '🍽️ Добавить в дневник'}
        </button>
      </div>
    </div>
  );
}

function RecipeModal({
  recipe,
  onClose,
  onAdd,
  inDiary,
}: {
  recipe: Recipe;
  onClose: () => void;
  onAdd: (id: string) => void;
  inDiary: boolean;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="modal-title">{recipe.name}</h2>
        <div className="modal-category">{CATEGORY_LABELS[recipe.category]}</div>

        <div className="modal-nutrition">
          <span>🔥 <small>{recipe.nutrition.calories} ккал</small></span>
          <span>🥩 <small>{recipe.nutrition.protein}г</small></span>
          <span>🧈 <small>{recipe.nutrition.fat}г</small></span>
          <span>🌾 <small>{recipe.nutrition.carbs}г</small></span>
        </div>

        <div className="modal-section">
          <h4>📋 Ингредиенты</h4>
          <ul>
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                <span>{ing.name}</span>
                <span><strong>{ing.weight}{ing.unit || 'г'}</strong></span>
              </li>
            ))}
          </ul>
        </div>

        <div className="modal-section">
          <h4>👩‍🍳 Инструкция</h4>
          <ol>
            {recipe.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        <button
          className={`btn-add ${inDiary ? 'added' : ''}`}
          onClick={() => onAdd(recipe.id)}
        >
          {inDiary ? '✅ В дневнике' : '🍽️ Добавить в дневник'}
        </button>
      </div>
    </div>
  );
}
