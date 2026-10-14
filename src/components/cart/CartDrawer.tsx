import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatKwanza } from '../../data/mockData';
import { X, Trash2, ShoppingBag, ArrowRight, Plus, Minus, Store } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cartDrawerOpen,
    setCartDrawerOpen,
    cart,
    cartTotal,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    setCheckoutModalOpen,
  } = useApp();

  if (!cartDrawerOpen) return null;

  const handleProceedToCheckout = () => {
    setCartDrawerOpen(false);
    setCheckoutModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base font-display">Carrinho de Compras</h3>
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
              {cart.length} itens
            </span>
          </div>

          <button
            onClick={() => setCartDrawerOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">O seu carrinho está vazio</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Explore os nossos artigos em destaque e adicione os produtos desejados.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3"
              >
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mb-0.5">
                    <Store className="w-3 h-3 text-amber-600" />
                    <span className="truncate">{item.product.storeName}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.product.name}</h4>
                  <p className="text-xs font-black text-amber-700 mt-0.5">
                    {formatKwanza(item.product.price)}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout button */}
        {cart.length > 0 && (
          <div className="p-4 bg-white border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal dos Artigos:</span>
              <span className="font-bold text-slate-900">{formatKwanza(cartTotal)}</span>
            </div>

            <div className="flex items-center justify-between text-sm font-black text-slate-900 border-t border-slate-100 pt-2 font-display">
              <span>Total Estimado:</span>
              <span className="text-amber-700 text-lg">{formatKwanza(cartTotal)}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={clearCart}
                className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Esvaziar
              </button>
              <button
                onClick={handleProceedToCheckout}
                className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Finalizar Encomenda</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
