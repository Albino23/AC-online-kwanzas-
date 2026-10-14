import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatKwanza } from '../../data/mockData';
import { ShoppingCart, Heart, MessageSquare, AlertTriangle, MapPin, Store, CheckCircle, Star } from 'lucide-react';

export const ProductGrid: React.FC = () => {
  const {
    products,
    stores,
    selectedCategory,
    selectedProvince,
    searchQuery,
    filterStoreId,
    addToCart,
    toggleWishlist,
    isInWishlist,
    openChatWithStore,
    openReportModal,
    openProductDetail,
    setFilterStoreId,
  } = useApp();

  // Only show products from active (or approved) stores
  const activeStoreIds = new Set(stores.filter((s) => s.status === 'ativa').map((s) => s.id));

  const filteredProducts = products.filter((p) => {
    // Must be active and store must be active
    if (!p.active) return false;
    if (!activeStoreIds.has(p.storeId)) return false;

    // Filter by specific store if selected
    if (filterStoreId && p.storeId !== filterStoreId) return false;

    // Filter by category
    if (selectedCategory !== 'Todas' && p.category !== selectedCategory) return false;

    // Filter by province
    if (selectedProvince !== 'Todas' && p.province !== selectedProvince) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchStore = p.storeName.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchStore && !matchCategory) return false;
    }

    return true;
  });

  return (
    <div id="products-section" className="my-8">
      {/* Header of Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
              Produtos em Destaque no Mercado
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Artigos autênticos disponíveis para entrega em Angola • Todos os valores expressos em Kwanzas (Kz)
          </p>
        </div>

        {filterStoreId && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs text-amber-900">
            <span>A filtrar pela loja: <strong>{products.find((p) => p.storeId === filterStoreId)?.storeName || 'Loja Selecionada'}</strong></span>
            <button
              onClick={() => setFilterStoreId(null)}
              className="text-amber-800 hover:text-amber-950 font-bold ml-2 underline cursor-pointer"
            >
              Ver Todas
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhum artigo encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Não foram encontrados produtos correspondentes aos filtros selecionados. Tente alterar a província ou a categoria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const isFav = isInWishlist(product.id);
            const isOutOfStock = product.stock <= 0;

            return (
              <div
                key={product.id}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative"
              >
                {/* Image & Badges */}
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => openProductDetail(product)}>
                  <img
                    src={product.images[0] || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Featured Badge */}
                  {product.featured && (
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                      Destaque
                    </span>
                  )}

                  {/* Stock Status Badge */}
                  {isOutOfStock ? (
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold">
                      Esgotado
                    </span>
                  ) : product.stock <= 3 ? (
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-bold">
                      Últimas {product.stock} un.
                    </span>
                  ) : null}

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 hover:bg-white text-slate-600 hover:text-rose-600 shadow-md transition-all cursor-pointer"
                    title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Store & Province info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 truncate max-w-[60%]">
                        <Store className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate">{product.storeName}</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 shrink-0">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {product.province}
                      </span>
                    </div>

                    {/* Product Title */}
                    <h3
                      onClick={() => openProductDetail(product)}
                      className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 cursor-pointer leading-snug"
                    >
                      {product.name}
                    </h3>

                    {/* Rating & reviews */}
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{product.rating.toFixed(1)}</span>
                      <span className="text-slate-400 text-[10px]">({product.reviewCount || 12} avaliações)</span>
                    </div>
                  </div>

                  {/* Price and Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg font-black text-slate-900 font-display">
                        {formatKwanza(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatKwanza(product.originalPrice)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Direct Chat with Store button */}
                      <button
                        onClick={() => openChatWithStore(product.storeId, product.id)}
                        title="Conversar em privado com o vendedor deste produto"
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 hover:text-amber-800 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      {/* Add to Cart button */}
                      <button
                        onClick={() => addToCart(product, 1)}
                        disabled={isOutOfStock}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                          isOutOfStock
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 hover:shadow-md'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {isOutOfStock ? 'Esgotado' : 'Adicionar'}
                      </button>

                      {/* Denunciar Button */}
                      <button
                        onClick={() => openReportModal('product', product.id, product.name)}
                        title="Denunciar produto irregular"
                        className="p-2.5 rounded-xl border border-transparent hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
