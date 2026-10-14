import React from 'react';
import { useApp } from '../../context/AppContext';
import { PRODUCT_CATEGORIES } from '../../data/mockData';
import { Layers } from 'lucide-react';

export const CategoryChips: React.FC = () => {
  const { selectedCategory, setSelectedCategory } = useApp();

  const allCategories = ['Todas', ...PRODUCT_CATEGORIES];

  return (
    <div className="my-6">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-amber-600" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Categorias de Artigos
        </h3>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {allCategories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};
