import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingCart, Store, ShieldCheck, Zap, Sparkles, MapPin } from 'lucide-react';

export const HeroBanners: React.FC = () => {
  const { setAuthModalOpen, setAuthModalMode, setAuthModalRole, setCurrentView, currentUser, isVendor } = useApp();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white shadow-xl my-6 border border-amber-900/30">
      {/* Background glow decoration */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none"></div>

      <div className="relative px-6 py-10 sm:px-12 sm:py-16 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-4 border border-amber-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Grande Mercado Digital de Angola • Moeda Kwanza (Kz)</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight font-display mb-4">
          Compre e Venda com <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">Confiança Total</span> em Angola.
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mb-8 leading-relaxed">
          Kits Starlink, telemóveis de última geração, grandes cabazes alimentares e produtos de lojas verificadas nas 18 províncias. Pagamentos por Multicaixa Express, referências e IBAN nacional.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              const el = document.getElementById('products-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg hover:shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            Explorar Produtos em Destaque
          </button>

          {!isVendor && (
            <button
              onClick={() => {
                if (currentUser) {
                  setCurrentView('vendor-dashboard');
                } else {
                  setAuthModalRole('vendedor');
                  setAuthModalMode('register');
                  setAuthModalOpen(true);
                }
              }}
              className="px-6 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-white font-bold text-sm rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Store className="w-4 h-4 text-emerald-400" />
              Abrir Minha Loja (2 Meses Grátis)
            </button>
          )}
        </div>

        {/* Feature badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-10 pt-8 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">Comprovativo Seguro</p>
              <p className="text-slate-400 text-[11px]">Validação direta pelo lojista</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">Multicaixa Express</p>
              <p className="text-slate-400 text-[11px]">Pagamento instantâneo via telemóvel</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">18 Províncias</p>
              <p className="text-slate-400 text-[11px]">Entregas em toda a Angola</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
