import React from 'react';
import { useApp } from '../../context/AppContext';
import { Store as StoreIcon, MapPin, ShieldCheck, Star, MessageSquare, ArrowRight, Sparkles } from 'lucide-react';

export const StoresDirectory: React.FC = () => {
  const { stores, products, setFilterStoreId, setCurrentView, openChatWithStore, openReportModal } = useApp();

  // Active stores visible to clients and vendors
  const publicStores = stores.filter((s) => s.status === 'ativa');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <StoreIcon className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            Lojas e Comerciantes Oficiais de Angola
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Descubra lojas verificadas nas províncias de Luanda, Benguela, Huambo, Huíla e em todo o território nacional.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publicStores.map((store) => {
          const storeProductsCount = products.filter((p) => p.storeId === store.id && p.active).length;

          return (
            <div
              key={store.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-400 hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={store.logo || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80'}
                      alt={store.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                    />
                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-tight flex items-center gap-1.5">
                        {store.name}
                        <span title="Loja Verificada">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{store.category}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{store.rating.toFixed(1)}</span>
                        <span className="text-slate-400 font-normal">({store.totalSales} vendas concluídas)</span>
                      </div>
                    </div>
                  </div>

                  {store.isVip && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 border border-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      VIP
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100 mb-4">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Província: <strong>{store.province}</strong></span>
                  </p>
                  <p className="text-slate-500 truncate">
                    NIF: <span className="font-mono text-slate-700">{store.nif}</span> (Registado na AGT)
                  </p>
                  {store.supportPhone && (
                    <p className="text-slate-500">
                      Contacto Loja: <span className="font-semibold text-slate-800">{store.supportPhone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openChatWithStore(store.id)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition-colors cursor-pointer"
                  title="Falar no Chat com o Comerciante"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setFilterStoreId(store.id);
                    setCurrentView('home');
                  }}
                  className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Ver {storeProductsCount} Artigos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
