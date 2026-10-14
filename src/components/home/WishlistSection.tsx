import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatKwanza } from '../../data/mockData';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';

export const WishlistSection: React.FC = () => {
  const { wishlist, products, toggleWishlist, addToCart, openProductDetail } = useApp();

  if (wishlist.length === 0) return null;

  const favoriteProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div id="wishlist-section" className="my-10 p-6 bg-rose-50/50 rounded-3xl border border-rose-100">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
        <h3 className="text-lg font-bold font-display text-slate-900">
          A Sua Lista de Favoritos ({favoriteProducts.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {favoriteProducts.map((p) => (
          <div key={p.id} className="bg-white p-3 rounded-2xl border border-rose-100 shadow-xs flex items-center gap-3">
            <img
              src={p.images[0]}
              alt={p.name}
              onClick={() => openProductDetail(p)}
              className="w-16 h-16 rounded-xl object-cover shrink-0 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <h4 onClick={() => openProductDetail(p)} className="text-xs font-bold text-slate-900 truncate cursor-pointer hover:text-amber-700">
                {p.name}
              </h4>
              <p className="text-xs font-black text-amber-700 mt-0.5">{formatKwanza(p.price)}</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => addToCart(p, 1)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ShoppingCart className="w-3 h-3" />
                  Comprar
                </button>
                <button
                  onClick={() => toggleWishlist(p.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
