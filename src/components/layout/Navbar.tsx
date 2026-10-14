import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ANGOLA_PROVINCES, ADMIN_PHONE, ADMIN_SUPPORT_EMAIL } from '../../data/mockData';
import {
  Search,
  ShoppingCart,
  Heart,
  MessageSquare,
  Bell,
  User as UserIcon,
  Store,
  Shield,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  LogOut,
  KeyRound,
  Package,
  Layers
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    isVendor,
    userStore,
    logout,
    currentView,
    setCurrentView,
    searchQuery,
    setSearchQuery,
    selectedProvince,
    setSelectedProvince,
    cartCount,
    setCartDrawerOpen,
    setAuthModalOpen,
    setAuthModalMode,
    setAuthModalRole,
    setChatDrawerOpen,
    setNotificationsDrawerOpen,
    setOrdersModalOpen,
    setChangePasswordModalOpen,
    notifications,
    conversations,
    wishlist,
  } = useApp();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  // Unread chat messages
  const unreadChats = conversations.reduce((acc, c) => {
    if (isVendor) return acc + (c.unreadByStore || 0);
    return acc + (c.unreadByCustomer || 0);
  }, 0);

  const handleOpenAuth = (role: 'cliente' | 'vendedor', mode: 'login' | 'register') => {
    setAuthModalRole(role);
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-slate-200">
      {/* Top Banner with Official Support of Administrator */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              AC Online Kwanza • O Mercado Oficial de Angola
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-400">
              Pagamentos em Kwanzas (Kz) • Multicaixa Express • BAI • BFA • BMA
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a
              href={`https://wa.me/244936304817`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-amber-400 transition-colors"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>Suporte Admin: {ADMIN_PHONE}</span>
            </a>
            <span className="text-slate-600">|</span>
            <a
              href={`mailto:${ADMIN_SUPPORT_EMAIL}`}
              className="hidden sm:flex items-center gap-1 hover:text-amber-400 transition-colors"
            >
              <Mail className="w-3 h-3 text-amber-400" />
              <span>{ADMIN_SUPPORT_EMAIL}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-white font-extrabold text-xl shadow-md group-hover:scale-105 transition-transform">
                AC
              </div>
              <div>
                <span className="block text-lg font-extrabold tracking-tight text-slate-900 font-display leading-tight">
                  AC ONLINE <span className="text-amber-600">KWANZA</span>
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  Marketplace Nacional 🇦🇴
                </span>
              </div>
            </button>

            {/* Navigation links */}
            <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  currentView === 'home'
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Início
              </button>
              <button
                onClick={() => setCurrentView('stores')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  currentView === 'stores'
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Store className="w-4 h-4 text-emerald-600" />
                Lojas
              </button>
            </nav>
          </div>

          {/* Search Bar & Province Selector */}
          <div className="flex-1 max-w-xl hidden md:flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar telemóveis, Starlink, cabazes, geradores..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl outline-none transition-all"
              />
            </div>

            <div className="relative w-44 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-amber-600 absolute left-2.5 top-3 pointer-events-none" />
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full pl-8 pr-6 py-2 text-xs font-medium bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-xl outline-none focus:border-amber-500 appearance-none cursor-pointer"
              >
                <option value="Todas">Toda Angola (18 Prov.)</option>
                {ANGOLA_PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wishlist Heart */}
            <button
              onClick={() => {
                if (!currentUser) {
                  setAuthModalOpen(true);
                } else {
                  // Scroll to wishlist or open wishlist section
                  const el = document.getElementById('wishlist-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              title="Favoritos"
              className="relative p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <Heart className={`w-5 h-5 ${wishlist.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Chat button with unread counter */}
            <button
              onClick={() => {
                if (!currentUser) {
                  setAuthModalOpen(true);
                } else {
                  setChatDrawerOpen(true);
                }
              }}
              title="Mensagens e Chat Privado"
              className="relative p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadChats > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadChats}
                </span>
              )}
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => {
                if (!currentUser) {
                  setAuthModalOpen(true);
                } else {
                  setNotificationsDrawerOpen(true);
                }
              }}
              title="Notificações"
              className="relative p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline font-bold text-xs">
                Carrinho
              </span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white text-amber-700 text-xs font-extrabold">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile / Auth Area */}
            <div className="relative">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  {/* Distinct Button for Admin */}
                  {isAdmin && (
                    <button
                      onClick={() => setCurrentView('admin-dashboard')}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-slate-900 to-amber-950 text-amber-300 hover:text-white rounded-xl text-xs font-bold border border-amber-500/30 shadow-xs cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      Admin Geral
                    </button>
                  )}

                  {/* Distinct Button for Vendor */}
                  {isVendor && (
                    <button
                      onClick={() => setCurrentView('vendor-dashboard')}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Store className="w-3.5 h-3.5" />
                      Painel do Vendedor
                      {userStore && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                          userStore.status === 'ativa'
                            ? 'bg-emerald-950/40 text-emerald-100'
                            : userStore.status === 'pendente'
                            ? 'bg-amber-400 text-amber-950'
                            : 'bg-rose-500 text-white'
                        }`}>
                          {userStore.status === 'ativa' ? 'Ativa' : userStore.status === 'pendente' ? 'Pendente' : 'Aviso'}
                        </span>
                      )}
                    </button>
                  )}

                  {/* User Avatar Menu Trigger */}
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenAuth('cliente', 'login')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => handleOpenAuth('vendedor', 'register')}
                    className="hidden sm:flex items-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    Vender (2 Meses Grátis)
                  </button>
                </div>
              )}

              {/* Dropdown Menu */}
              {userDropdownOpen && currentUser && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in duration-150">
                  <div className="p-3 border-b border-slate-100">
                    <p className="font-bold text-sm text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {isAdmin ? 'Super Administrador' : isVendor ? 'Comerciante / Vendedor' : 'Cliente Comprador'}
                    </span>
                  </div>

                  <div className="py-1 text-xs">
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setCurrentView('admin-dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 text-amber-900 font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-amber-600" />
                        Painel de Administração
                      </button>
                    )}

                    {isVendor && (
                      <button
                        onClick={() => {
                          setCurrentView('vendor-dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-emerald-900 font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <Store className="w-4 h-4 text-emerald-600" />
                        Gerir Minha Loja & Produtos
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setOrdersModalOpen(true);
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-slate-500" />
                      Minhas Encomendas
                    </button>

                    <button
                      onClick={() => {
                        setChangePasswordModalOpen(true);
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-slate-500" />
                      Alterar Palavra-passe
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Terminar Sessão
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-2.5 flex md:hidden items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar artigos em Angola..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl outline-none"
            />
          </div>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="w-32 py-2 px-2 text-xs bg-slate-100 border border-slate-200 rounded-xl outline-none"
          >
            <option value="Todas">18 Províncias</option>
            {ANGOLA_PROVINCES.map((prov) => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
