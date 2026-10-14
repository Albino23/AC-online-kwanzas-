import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKwanza } from '../../data/mockData';
import {
  X,
  ShoppingCart,
  Heart,
  MessageSquare,
  AlertTriangle,
  Store,
  MapPin,
  ShieldCheck,
  Star,
  Check,
  Phone,
  Mail,
  Truck
} from 'lucide-react';

export const ProductDetailModal: React.FC = () => {
  const {
    productDetailModalOpen,
    closeProductDetail,
    selectedProduct,
    stores,
    addToCart,
    toggleWishlist,
    isInWishlist,
    openChatWithStore,
    openReportModal,
    setCartDrawerOpen,
  } = useApp();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!productDetailModalOpen || !selectedProduct) return null;

  const store = stores.find((s) => s.id === selectedProduct.storeId);
  const isFav = isInWishlist(selectedProduct.id);
  const isOutOfStock = selectedProduct.stock <= 0;

  const handleBuyNow = () => {
    addToCart(selectedProduct, quantity);
    closeProductDetail();
    setCartDrawerOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={closeProductDetail}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-md transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto flex-1 p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Images Column */}
            <div className="space-y-3">
              <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={selectedProduct.images[selectedImageIndex] || selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {selectedProduct.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedProduct.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImageIndex(i)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        selectedImageIndex === i ? 'border-amber-600 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Information Column */}
            <div className="flex flex-col justify-between">
              <div>
                {/* Store mini header */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Store className="w-4 h-4 text-amber-600" />
                    {selectedProduct.storeName}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedProduct.province}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 leading-snug">
                  {selectedProduct.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <div className="flex items-center text-amber-500 font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
                    {selectedProduct.rating.toFixed(1)}
                  </div>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{selectedProduct.reviewCount} avaliações</span>
                  <span className="text-slate-400">•</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                    {selectedProduct.category}
                  </span>
                </div>

                {/* Price */}
                <div className="mt-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-100/80">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                      {formatKwanza(selectedProduct.price)}
                    </span>
                    {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatKwanza(selectedProduct.originalPrice)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-900 mt-1 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Preço final em Kwanzas • Sem taxas adicionais
                  </p>
                </div>

                {/* Description */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Descrição do Artigo
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Delivery & Stock Info */}
                <div className="mt-4 space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Disponibilidade:</span>
                    <span className={`font-bold ${isOutOfStock ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {isOutOfStock ? 'Esgotado' : `${selectedProduct.stock} unidades em armazém`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Entrega rápida em Luanda (2.500 Kz) e outras províncias (5.000 Kz)</span>
                  </div>

                  {store?.supportPhone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Contacto da Loja: <strong>{store.supportPhone}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Section */}
              <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
                {/* Quantity selector */}
                {!isOutOfStock && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">Quantidade:</span>
                    <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-3 py-1.5 text-xs font-bold min-w-8 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(selectedProduct.stock, q + 1))}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* Chat with store button */}
                  <button
                    onClick={() => {
                      closeProductDetail();
                      openChatWithStore(selectedProduct.storeId, selectedProduct.id);
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-slate-700 hover:text-amber-800 transition-colors cursor-pointer"
                    title="Conversar em privado com o vendedor deste produto"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>

                  {/* Wishlist button */}
                  <button
                    onClick={() => toggleWishlist(selectedProduct.id)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                    title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  {/* Add to cart */}
                  <button
                    onClick={() => addToCart(selectedProduct, quantity)}
                    disabled={isOutOfStock}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Adicionar
                  </button>

                  {/* Buy now */}
                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    Comprar Já
                  </button>
                </div>

                <div className="text-center pt-1">
                  <button
                    onClick={() => openReportModal('product', selectedProduct.id, selectedProduct.name)}
                    className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center justify-center gap-1 mx-auto"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Denunciar este produto à moderação
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
