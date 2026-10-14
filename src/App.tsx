import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HeroBanners } from './components/home/HeroBanners';
import { CategoryChips } from './components/home/CategoryChips';
import { ProductGrid } from './components/home/ProductGrid';
import { WishlistSection } from './components/home/WishlistSection';
import { StoresDirectory } from './components/stores/StoresDirectory';
import { VendorDashboard } from './components/vendor/VendorDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { ProductDetailModal } from './components/product/ProductDetailModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { InvoiceModal } from './components/orders/InvoiceModal';
import { OrdersListModal } from './components/orders/OrdersListModal';
import { ChatDrawer } from './components/chat/ChatDrawer';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { ReportModal } from './components/moderation/ReportModal';
import { ToastContainer } from './components/common/Toast';

const MainLayout: React.FC = () => {
  const { currentView } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-500 selection:text-white">
      {/* Navbar with official support & user state */}
      <Navbar />

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <HeroBanners />
            <CategoryChips />
            <ProductGrid />
            <WishlistSection />
          </div>
        )}

        {currentView === 'stores' && <StoresDirectory />}

        {currentView === 'vendor-dashboard' && <VendorDashboard />}

        {currentView === 'admin-dashboard' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Modals & Drawers */}
      <AuthModal />
      <ChangePasswordModal />
      <ProductDetailModal />
      <CartDrawer />
      <CheckoutModal />
      <InvoiceModal />
      <OrdersListModal />
      <ChatDrawer />
      <NotificationDrawer />
      <ReportModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
