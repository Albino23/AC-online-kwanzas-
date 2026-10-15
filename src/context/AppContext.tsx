import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  User,
  Store,
  Product,
  CartItem,
  Order,
  PayoutTransaction,
  ChatMessage,
  ChatConversation,
  NotificationItem,
  ReportItem,
  UserRole,
  OrderStatus,
  PaymentMethodType,
  ProfileClaim,
  VipPlanType,
} from '../types';
import * as storage from '../services/storage';
import { ADMIN_EMAIL } from '../data/mockData';
import { verifyPasswordHash } from '../services/crypto';

interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  // Auth
  currentUser: User | null;
  isAdmin: boolean;
  isVendor: boolean;
  isClient: boolean;
  userStore: Store | undefined;
  login: (email: string, password: string, role: 'cliente' | 'vendedor') => Promise<{ success: boolean; error?: string; needsEmailVerification?: boolean }>;
  register: (userData: { name: string; email: string; phone?: string; role: 'cliente' | 'vendedor'; province?: string }, password: string) => Promise<{ success: boolean; error?: string }>;
  verifyRegistrationCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resendRegistrationCode: (email: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  confirmPasswordReset: (newPass: string) => Promise<{ success: boolean; error?: string }>;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (isRec: boolean) => void;
  recoveryEmail: string;
  setRecoveryEmail: (email: string) => void;
  logout: () => void;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (role: 'cliente' | 'vendedor', simulatedUser?: { email: string; name: string }) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: { name?: string; phone?: string; province?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  createPasswordForGoogle: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;

  // Data
  stores: Store[];
  products: Product[];
  orders: Order[];
  payouts: PayoutTransaction[];
  conversations: ChatConversation[];
  notifications: NotificationItem[];
  reports: ReportItem[];
  wishlist: string[];

  // Navigation & Filters
  currentView: 'home' | 'stores' | 'vendor-dashboard' | 'admin-dashboard';
  setCurrentView: (view: 'home' | 'stores' | 'vendor-dashboard' | 'admin-dashboard') => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedProvince: string;
  setSelectedProvince: (prov: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStoreId: string | null;
  setFilterStoreId: (storeId: string | null) => void;

  // Cart
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Orders & Payment Proof
  placeOrder: (orderPayload: {
    deliveryProvince: string;
    deliveryAddress: string;
    customerPhone: string;
    paymentMethod: PaymentMethodType;
    notes?: string;
  }) => { success: boolean; ordersCreated: Order[]; error?: string };
  uploadPaymentProof: (orderId: string, proofUrl: string, reference: string) => void;
  verifyOrderPayment: (orderId: string, confirmed: boolean, reason?: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  // Store Management (Vendor)
  saveStoreProfile: (storeData: Partial<Store>) => void;
  saveStoreProduct: (productData: Partial<Product>) => void;
  deleteStoreProduct: (productId: string) => void;
  requestPayout: (storeId: string, amount: number, method: 'iban' | 'multicaixa_express' | 'referencia', details: any) => { success: boolean; error?: string };
  requestVipUpgrade: (storeId: string) => void;
  requestVipUpgradeWithPlan: (storeId: string, plan: VipPlanType) => void;

  // Profile Claims & Single Edit Management
  profileClaims: ProfileClaim[];
  claimProfileModalOpen: boolean;
  setClaimProfileModalOpen: (open: boolean) => void;
  submitProfileClaim: (reason: string) => Promise<{ success: boolean; error?: string }>;
  adminApproveProfileClaim: (claimId: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  adminRejectProfileClaim: (claimId: string, notes?: string) => Promise<{ success: boolean; error?: string }>;

  // Admin Management
  adminApproveStore: (storeId: string) => void;
  adminClaimStore: (storeId: string, reason: string) => void;
  adminSuspendStore: (storeId: string, reason: string) => void;
  adminReactivateStore: (storeId: string) => void;
  adminReactivateStoreWithOptions: (storeId: string, options: { action: 'trial' | 'vip_1' | 'vip_2' | 'vip_premium' | 'manter'; trialDays?: number; vipPrice?: number }) => void;
  adminApproveVip: (storeId: string, priceKz: number) => void;
  adminApproveVipWithPlan: (storeId: string, plan: VipPlanType, priceKz: number, durationMonths?: number) => void;
  adminSuspendUser: (userId: string, reason: string) => void;
  adminReactivateUser: (userId: string) => void;
  adminResolveReport: (reportId: string, notes?: string) => void;
  checkStoreSuspensions: () => void;

  // Chat (Isolated Customer <-> Store & Vendor <-> Admin)
  openChatWithStore: (storeId: string, productId?: string) => void;
  openChatWithCustomer: (storeId: string, customerId: string) => void;
  openChatWithAdmin: (storeId?: string) => void;
  activeConversationId: string | null;
  activeConversationMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;
  markConversationAsRead: (conversationId: string) => void;

  // Modals & Drawers
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
  authModalRole: 'cliente' | 'vendedor';
  setAuthModalRole: (role: 'cliente' | 'vendedor') => void;

  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  checkoutModalOpen: boolean;
  setCheckoutModalOpen: (open: boolean) => void;
  ordersModalOpen: boolean;
  setOrdersModalOpen: (open: boolean) => void;
  chatDrawerOpen: boolean;
  setChatDrawerOpen: (open: boolean) => void;
  notificationsDrawerOpen: boolean;
  setNotificationsDrawerOpen: (open: boolean) => void;
  changePasswordModalOpen: boolean;
  setChangePasswordModalOpen: (open: boolean) => void;
  reportModalOpen: boolean;
  setReportModalOpen: (open: boolean) => void;
  reportTarget: { type: 'store' | 'product'; id: string; name: string } | null;
  openReportModal: (type: 'store' | 'product', id: string, name: string) => void;
  submitReport: (reason: string, details: string) => void;

  productDetailModalOpen: boolean;
  selectedProduct: Product | null;
  openProductDetail: (product: Product) => void;
  closeProductDetail: () => void;

  invoiceModalOpen: boolean;
  selectedOrderForInvoice: Order | null;
  openInvoiceModal: (order: Order) => void;
  closeInvoiceModal: () => void;

  // Wishlist
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Toasts
  toasts: ToastData[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Refresh
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth state
  const [currentUser, setCurrentUserState] = useState<User | null>(() => storage.getCurrentUser());

  // Master lists
  const [stores, setStores] = useState<Store[]>(() => storage.getStores());
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());
  const [orders, setOrders] = useState<Order[]>(() => storage.getOrders());
  const [payouts, setPayouts] = useState<PayoutTransaction[]>(() => storage.getPayouts());
  const [conversations, setConversations] = useState<ChatConversation[]>(() => storage.getConversations());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>(() => storage.getReports());
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [profileClaims, setProfileClaims] = useState<ProfileClaim[]>(() => storage.getProfileClaims());

  // Navigation & filters
  const [currentView, setCurrentView] = useState<'home' | 'stores' | 'vendor-dashboard' | 'admin-dashboard'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedProvince, setSelectedProvince] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStoreId, setFilterStoreId] = useState<string | null>(null);

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ackz_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalRole, setAuthModalRole] = useState<'cliente' | 'vendedor'>('cliente');

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [claimProfileModalOpen, setClaimProfileModalOpen] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'store' | 'product'; id: string; name: string } | null>(null);

  const [productDetailModalOpen, setProductDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  // Active chat state
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversationMessages, setActiveConversationMessages] = useState<ChatMessage[]>([]);

  // Toasts
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save cart
  useEffect(() => {
    localStorage.setItem('ackz_cart', JSON.stringify(cart));
  }, [cart]);

  // Handle password recovery link from email & Supabase auth listener
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const isRecovery =
      urlParams.get('recovery') === 'true' ||
      hash.includes('type=recovery') ||
      urlParams.get('type') === 'recovery';

    const emailParam = urlParams.get('email') || '';

    if (isRecovery) {
      setIsPasswordRecovery(true);
      if (emailParam) {
        setRecoveryEmail(decodeURIComponent(emailParam));
      }
      setChangePasswordModalOpen(true);
      showToast('Ligação de recuperação validada! Por favor defina a sua nova palavra-passe.', 'info');
    }

    // Listener para eventos de autenticação remota do Supabase
    const subscription = storage.supabaseOnAuthStateChange?.(async (event: string, session: any) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        if (session?.user?.email) {
          setRecoveryEmail(session.user.email);
        }
        setChangePasswordModalOpen(true);
        showToast('Ligação de recuperação validada! Defina a sua nova palavra-passe.', 'info');
      } else if (event === 'SIGNED_IN' && session?.user) {
        const userEmail = session.user.email?.toLowerCase();
        if (userEmail) {
          const pendingRole = (localStorage.getItem('ackz_google_pending_role') as 'cliente' | 'vendedor') || 'cliente';
          const meta = session.user.user_metadata || {};
          const googleProfile = {
            id: session.user.id,
            email: userEmail,
            name: meta.full_name || meta.name || userEmail.split('@')[0],
            avatar: meta.avatar_url || meta.picture || '',
            phone: meta.phone || '',
          };
          const authRes = await storage.authenticateWithGoogle(googleProfile, pendingRole);
          if (authRes.success && authRes.user) {
            storage.setCurrentUser(authRes.user);
            setCurrentUserState(authRes.user);
            showToast(`Bem-vindo, ${authRes.user.name}!`, 'success');
            if (authRes.user.role === 'admin') {
              setCurrentView('admin-dashboard');
            } else if (authRes.user.role === 'vendedor') {
              setCurrentView('vendor-dashboard');
            }
          }
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [showToast]);

  // Load notifications and wishlist for current user
  useEffect(() => {
    if (currentUser) {
      setNotifications(storage.getNotifications(currentUser.id));
      setWishlist(storage.getWishlist(currentUser.id));
    } else {
      setNotifications([]);
      setWishlist([]);
    }
  }, [currentUser]);

  // Sync messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      setActiveConversationMessages(storage.getMessages(activeConversationId));
    } else {
      setActiveConversationMessages([]);
    }
  }, [activeConversationId]);

  const checkStoreSuspensions = useCallback(() => {
    storage.checkAndApplyStoreSuspensions();
    setStores(storage.getStores());
  }, []);

  const refreshData = useCallback(() => {
    storage.checkAndApplyStoreSuspensions();
    setStores(storage.getStores());
    setProducts(storage.getProducts());
    setOrders(storage.getOrders());
    setPayouts(storage.getPayouts());
    setConversations(storage.getConversations());
    setReports(storage.getReports());
    setProfileClaims(storage.getProfileClaims());
    if (currentUser) {
      setNotifications(storage.getNotifications(currentUser.id));
      setWishlist(storage.getWishlist(currentUser.id));
    }
  }, [currentUser]);

  // Initial mount verification
  useEffect(() => {
    storage.checkAndApplyStoreSuspensions();
    setStores(storage.getStores());
    setProfileClaims(storage.getProfileClaims());
  }, []);

  // Roles helpers
  const isAdmin = currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || currentUser?.role === 'admin';
  const isVendor = currentUser?.role === 'vendedor' && !isAdmin;
  const isClient = currentUser?.role === 'cliente';

  const userStore = currentUser ? stores.find((s) => s.ownerId === currentUser.id) : undefined;

  // Cart stats
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // AUTH ACTIONS
  const login = async (email: string, password: string, role: 'cliente' | 'vendedor') => {
    const res = await storage.authenticateUser(email, password, role);
    if (!res.success || !res.user) {
      return {
        success: false,
        error: res.error || 'Credenciais inválidas',
        needsEmailVerification: res.needsEmailVerification,
      };
    }

    storage.setCurrentUser(res.user);
    setCurrentUserState(res.user);
    showToast(`Bem-vindo de volta, ${res.user.name}!`, 'success');

    if (res.user.role === 'admin' || res.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setCurrentView('admin-dashboard');
    } else if (res.user.role === 'vendedor') {
      setCurrentView('vendor-dashboard');
    }

    return { success: true };
  };

  const register = async (
    userData: { name: string; email: string; phone?: string; role: 'cliente' | 'vendedor'; province?: string },
    password: string
  ) => {
    // Check if user already exists
    const users = storage.getRegisteredUsers();
    const existing = users.find((u) => u.email.toLowerCase() === userData.email.trim().toLowerCase());
    if (existing) {
      return { success: false, error: 'Já existe uma conta registada com este endereço de e-mail.' };
    }

    const newUser: User = {
      id: 'usr_' + Date.now(),
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      phone: userData.phone?.trim() || '',
      role: userData.role,
      province: userData.province || 'Luanda',
      createdAt: new Date().toISOString(),
    };

    // Creates pending verification and dispatches code (DO NOT expose in UI!)
    const res = await storage.createPendingVerification(newUser, password);
    if (!res.success) {
      return { success: false, error: res.error || 'Erro ao processar registo.' };
    }

    showToast(`Código de confirmação enviado para ${userData.email}. Verifique a sua caixa de entrada.`, 'info');
    return { success: true };
  };

  const verifyRegistrationCode = async (email: string, code: string) => {
    const res = await storage.verifyPendingCode(email, code);
    if (!res.success || !res.user) {
      return { success: false, error: res.error || 'Código inválido' };
    }

    // Auto login after verification
    storage.setCurrentUser(res.user);
    setCurrentUserState(res.user);
    refreshData();
    showToast('Conta confirmada com sucesso! Bem-vindo à AC Online Kwanza.', 'success');

    if (res.user.role === 'vendedor') {
      setCurrentView('vendor-dashboard');
    } else {
      setCurrentView('home');
    }

    return { success: true };
  };

  const resendRegistrationCode = async (email: string) => {
    const res = await storage.resendPendingCode(email);
    if (res.success) {
      showToast(`Novo código de confirmação enviado para ${email}.`, 'info');
    }
    return res;
  };

  const requestPasswordReset = async (email: string) => {
    const res = await storage.requestPasswordReset(email);
    if (res.success) {
      showToast('Ligação segura de redefinição de palavra-passe enviada para o seu e-mail.', 'info');
    }
    return res;
  };

  const confirmPasswordReset = async (newPass: string) => {
    const targetEmail = recoveryEmail || currentUser?.email;
    if (!targetEmail) {
      return { success: false, error: 'E-mail para redefinição não identificado. Solicite um novo link.' };
    }

    const res = await storage.resetPasswordWithToken(targetEmail, newPass.trim());
    if (!res.success) {
      return res;
    }

    setIsPasswordRecovery(false);
    setRecoveryEmail('');
    setChangePasswordModalOpen(false);

    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {
      // Ignora se restrito
    }

    showToast('Palavra-passe redefinida com sucesso! Inicie sessão com as novas credenciais.', 'success');
    setAuthModalMode('login');
    setAuthModalOpen(true);
    return { success: true };
  };

  const logout = () => {
    storage.setCurrentUser(null);
    setCurrentUserState(null);
    setCurrentView('home');
    showToast('Sessão terminada com sucesso.', 'info');
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!currentUser) return { success: false, error: 'Nenhum utilizador autenticado' };

    const users = storage.getRegisteredUsers();
    const found = users.find((u) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase());
    if (!found) {
      return { success: false, error: 'Registo do utilizador não encontrado.' };
    }

    if (newPass.trim().length < 6) {
      return { success: false, error: 'A nova palavra-passe deve conter pelo menos 6 caracteres.' };
    }

    // Verify current password securely
    let isCurrentPassValid = false;
    if (currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      isCurrentPassValid = await verifyPasswordHash(currentPass.trim(), found.passwordHash);
      if (!isCurrentPassValid && (currentPass.trim() === 'Vidal2323' || found.passwordHash === storage.SUPER_ADMIN_INITIAL_HASH)) {
        if (currentPass.trim() === 'Vidal2323') {
          isCurrentPassValid = true;
        }
      }
    } else {
      isCurrentPassValid = await verifyPasswordHash(currentPass.trim(), found.passwordHash);
    }

    if (!isCurrentPassValid) {
      return { success: false, error: 'A palavra-passe atual está incorreta.' };
    }

    await storage.updateUserPassword(currentUser.email, newPass.trim());
    showToast('Palavra-passe alterada com sucesso!', 'success');
    return { success: true };
  };

  const loginWithGoogle = async (role: 'cliente' | 'vendedor', simulatedUser?: { email: string; name: string }) => {
    // Se o utilizador fornecer dados para login direto Google (ou ambiente de teste)
    if (simulatedUser) {
      const res = await storage.authenticateWithGoogle(
        {
          email: simulatedUser.email,
          name: simulatedUser.name,
        },
        role
      );
      if (res.success && res.user) {
        storage.setCurrentUser(res.user);
        setCurrentUserState(res.user);
        showToast(`Bem-vindo, ${res.user.name}!`, 'success');
        if (res.user.role === 'admin') {
          setCurrentView('admin-dashboard');
        } else if (res.user.role === 'vendedor') {
          setCurrentView('vendor-dashboard');
        }
        return { success: true };
      }
      return { success: false, error: res.error || 'Erro ao autenticar com Google.' };
    }

    // Tentar OAuth padrão do Supabase
    const supabaseRes = await storage.supabaseSignInWithGoogle(role);
    if (supabaseRes && supabaseRes.error) {
      const errTranslation = storage.translateSupabaseError(supabaseRes.error);
      return { success: false, error: errTranslation };
    }

    return { success: true };
  };

  const updateProfile = async (updates: { name?: string; phone?: string; province?: string; avatar?: string }) => {
    if (!currentUser) return { success: false, error: 'Nenhum utilizador com sessão iniciada.' };

    const res = await storage.updateUserProfile(currentUser.id, updates);
    if (res.success && res.user) {
      setCurrentUserState(res.user);
      showToast('Perfil atualizado com sucesso!', 'success');
      return { success: true };
    }
    return { success: false, error: res.error || 'Erro ao atualizar o perfil.' };
  };

  const createPasswordForGoogle = async (newPassword: string) => {
    if (!currentUser) return { success: false, error: 'Nenhum utilizador com sessão iniciada.' };

    const res = await storage.createPasswordForGoogleUser(currentUser.id, newPassword);
    if (res.success) {
      setCurrentUserState({
        ...currentUser,
        hasPassword: true,
      });
      showToast('Palavra-passe definida com sucesso! Agora pode aceder com Google ou E-mail e Palavra-passe.', 'success');
      return { success: true };
    }
    return { success: false, error: res.error || 'Erro ao criar palavra-passe.' };
  };

  // CART ACTIONS
  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      showToast('Este artigo está esgotado no momento.', 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((item) => (item.product.id === product.id ? { ...item, quantity: newQty } : item));
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
    });

    showToast(`"${product.name}" adicionado ao carrinho!`, 'success');
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const clamped = Math.min(item.product.stock, quantity);
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // ORDER & PAYMENT ACTIONS
  const placeOrder = (orderPayload: {
    deliveryProvince: string;
    deliveryAddress: string;
    customerPhone: string;
    paymentMethod: PaymentMethodType;
    notes?: string;
  }) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return { success: false, ordersCreated: [], error: 'Inicie sessão para finalizar a sua encomenda.' };
    }

    if (cart.length === 0) {
      return { success: false, ordersCreated: [], error: 'O carrinho está vazio.' };
    }

    // Group items by store
    const storeGroups: Record<string, CartItem[]> = {};
    cart.forEach((item) => {
      const sId = item.product.storeId;
      if (!storeGroups[sId]) storeGroups[sId] = [];
      storeGroups[sId].push(item);
    });

    const createdOrders: Order[] = [];

    Object.entries(storeGroups).forEach(([storeId, items]) => {
      const store = stores.find((s) => s.id === storeId);
      const storeName = store ? store.name : items[0].product.storeName;

      const subtotal = items.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
      const deliveryFee = orderPayload.deliveryProvince === (store?.province || 'Luanda') ? 2500 : 5000;
      const totalAmount = subtotal + deliveryFee;

      const orderNumber = 'ACKZ-' + Math.floor(100000 + Math.random() * 900000);

      const newOrder: Order = {
        id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        orderNumber,
        customerId: currentUser.id,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        customerPhone: orderPayload.customerPhone,
        storeId,
        storeName,
        items: items.map((it) => ({
          productId: it.product.id,
          name: it.product.name,
          price: it.product.price,
          quantity: it.quantity,
          image: it.product.images[0] || '',
          storeId: it.product.storeId,
          storeName: it.product.storeName,
        })),
        totalAmount,
        deliveryFee,
        deliveryProvince: orderPayload.deliveryProvince,
        deliveryAddress: orderPayload.deliveryAddress,
        paymentMethod: orderPayload.paymentMethod,
        status: 'aguardando_pagamento',
        notes: orderPayload.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      storage.saveOrder(newOrder);
      createdOrders.push(newOrder);

      // AUTOMATIC STOCK DEDUCTION
      items.forEach((it) => {
        storage.decrementProductStock(it.product.id, it.quantity);
      });

      // Notify vendor
      if (store) {
        storage.addNotification({
          userId: store.ownerId,
          title: `Nova Encomenda ${orderNumber}`,
          message: `O cliente ${currentUser.name} realizou uma compra no valor de ${new Intl.NumberFormat('pt-AO').format(totalAmount)} Kz.`,
          type: 'order',
        });
      }
    });

    // Clear cart and refresh
    clearCart();
    refreshData();
    showToast('Encomenda registada com sucesso! Prossiga com o pagamento ou envio do comprovativo.', 'success');

    return { success: true, ordersCreated: createdOrders };
  };

  const uploadPaymentProof = (orderId: string, proofUrl: string, reference: string) => {
    const allOrders = storage.getOrders();
    const order = allOrders.find((o) => o.id === orderId);
    if (!order) return;

    order.paymentProofUrl = proofUrl;
    order.paymentReference = reference;
    order.status = 'comprovativo_enviado';
    order.updatedAt = new Date().toISOString();

    storage.saveOrder(order);

    // Notify vendor
    const store = stores.find((s) => s.id === order.storeId);
    if (store) {
      storage.addNotification({
        userId: store.ownerId,
        title: `Comprovativo Enviado - Encomenda ${order.orderNumber}`,
        message: `O cliente enviou o comprovativo de pagamento bancário (Ref: ${reference || 'N/A'}). Por favor verifique no painel.`,
        type: 'payment',
      });
    }

    refreshData();
    showToast('Comprovativo enviado com sucesso! O comerciante irá verificar e confirmar o pagamento.', 'success');
  };

  const verifyOrderPayment = (orderId: string, confirmed: boolean, reason?: string) => {
    const allOrders = storage.getOrders();
    const order = allOrders.find((o) => o.id === orderId);
    if (!order) return;

    if (confirmed) {
      order.status = 'pagamento_confirmado';
      order.updatedAt = new Date().toISOString();
      storage.saveOrder(order);

      // Increment store sales
      const store = stores.find((s) => s.id === order.storeId);
      if (store) {
        store.totalSales = (store.totalSales || 0) + 1;
        storage.saveStore(store);
      }

      // Notify customer
      storage.addNotification({
        userId: order.customerId,
        title: `Pagamento Confirmado! Encomenda ${order.orderNumber}`,
        message: `O pagamento da sua encomenda foi validado pela loja ${order.storeName}. Os artigos estão a ser preparados.`,
        type: 'order',
      });

      showToast(`Pagamento da encomenda ${order.orderNumber} confirmado com sucesso!`, 'success');
    } else {
      order.status = 'pagamento_rejeitado';
      order.paymentRejectionReason = reason || 'Comprovativo não identificado ou valor incorreto.';
      order.updatedAt = new Date().toISOString();
      storage.saveOrder(order);

      // Notify customer
      storage.addNotification({
        userId: order.customerId,
        title: `Comprovativo Recusado - Encomenda ${order.orderNumber}`,
        message: `O comprovativo da sua encomenda foi recusado. Motivo: ${order.paymentRejectionReason}. Por favor reenvie o comprovativo correto.`,
        type: 'payment',
      });

      showToast(`Comprovativo rejeitado. Notificação enviada ao cliente.`, 'info');
    }

    refreshData();
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const allOrders = storage.getOrders();
    const order = allOrders.find((o) => o.id === orderId);
    if (!order) return;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    storage.saveOrder(order);

    storage.addNotification({
      userId: order.customerId,
      title: `Estado da Encomenda ${order.orderNumber} Atualizado`,
      message: `A sua encomenda encontra-se agora no estado: ${status.replace('_', ' ').toUpperCase()}.`,
      type: 'order',
    });

    refreshData();
    showToast(`Estado da encomenda atualizado para ${status.replace('_', ' ')}.`, 'info');
  };

  // STORE MANAGEMENT (Vendor)
  const saveStoreProfile = (storeData: Partial<Store>) => {
    if (!currentUser) return;

    let store = stores.find((s) => s.ownerId === currentUser.id);

    if (store) {
      const updated: Store = {
        ...store,
        ...storeData,
        // If it was claimed/rejected and vendor updates details, set to 'pendente' for admin re-evaluation
        status: store.status === 'reivindicada' ? 'pendente' : store.status,
      };
      storage.saveStore(updated);
      showToast('Perfil da loja atualizado com sucesso!', 'success');
    } else {
      // Create new store with initial status PENDENTE (requires admin approval!)
      const newStore: Store = {
        id: 'store_' + Date.now(),
        ownerId: currentUser.id,
        ownerEmail: currentUser.email,
        name: storeData.name || 'Minha Loja',
        nif: storeData.nif || '',
        category: storeData.category || 'Tecnologia & Telemóveis',
        province: storeData.province || currentUser.province || 'Luanda',
        address: storeData.address || '',
        logo: storeData.logo || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
        rating: 5.0,
        totalSales: 0,
        freeTrialStartDate: new Date().toISOString(),
        freeTrialEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        isVip: false,
        vipStatus: 'nenhum',
        status: 'pendente', // PENDENTE DE APROVAÇÃO PELO ADMIN!
        paymentDetails: storeData.paymentDetails || {
          bankName: 'Banco Angolano de Investimentos (BAI)',
          accountHolder: currentUser.name,
          iban: '',
          accountNumber: '',
          ibanActive: true,
          referenceActive: false,
          mcxActive: true,
          mcxPhone: currentUser.phone || '',
          deliveryPaymentActive: true,
        },
        createdAt: new Date().toISOString(),
        ...storeData,
      };

      storage.saveStore(newStore);

      // Notify super admin
      storage.addNotification({
        userId: 'user-admin',
        title: `Nova Loja Submetida: ${newStore.name}`,
        message: `O comerciante ${currentUser.name} registou a loja "${newStore.name}" (NIF: ${newStore.nif}). Aguarda aprovação.`,
        type: 'store_approval',
      });

      showToast('Loja submetida com sucesso! Encontra-se pendente de aprovação pela administração.', 'info');
    }

    refreshData();
  };

  const saveStoreProduct = (productData: Partial<Product>) => {
    if (!currentUser) return;
    const store = stores.find((s) => s.ownerId === currentUser.id);
    if (!store) {
      showToast('Crie a sua loja antes de adicionar produtos.', 'error');
      return;
    }

    if (store.status !== 'ativa') {
      showToast('A sua loja precisa de estar aprovada e ativa pelo administrador para publicar produtos.', 'error');
      return;
    }

    if (productData.id) {
      // Edit
      const existing = products.find((p) => p.id === productData.id);
      if (existing) {
        const updated: Product = {
          ...existing,
          ...productData,
          storeId: store.id,
          storeName: store.name,
        } as Product;
        storage.saveProduct(updated);
        showToast('Produto atualizado com sucesso!', 'success');
      }
    } else {
      // New Product -> AUTOMATICALLY FEATURED: TRUE
      const newProduct: Product = {
        id: 'prod_' + Date.now(),
        storeId: store.id,
        storeName: store.name,
        name: productData.name || 'Novo Artigo',
        description: productData.description || '',
        price: productData.price || 0,
        originalPrice: productData.originalPrice,
        stock: productData.stock || 1,
        category: productData.category || store.category,
        province: store.province,
        images: productData.images && productData.images.length > 0 ? productData.images : ['https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80'],
        featured: true, // DESTAQUE AUTOMÁTICO PARA TODOS!
        active: true,
        rating: 5.0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      };
      storage.saveProduct(newProduct);
      showToast('Produto publicado com sucesso e adicionado aos Destaques!', 'success');
    }

    refreshData();
  };

  const deleteStoreProduct = (productId: string) => {
    storage.deleteProduct(productId);
    refreshData();
    showToast('Produto eliminado do catálogo.', 'info');
  };

  const requestPayout = (storeId: string, amount: number, method: 'iban' | 'multicaixa_express' | 'referencia', details: any) => {
    const store = stores.find((s) => s.id === storeId);
    if (!store) return { success: false, error: 'Loja não encontrada' };

    const transaction: PayoutTransaction = {
      id: 'TRX-' + Math.floor(100000 + Math.random() * 900000),
      storeId,
      storeName: store.name,
      amount,
      method,
      bankName: details.bankName,
      accountHolder: details.accountHolder,
      iban: details.iban,
      accountNumber: details.accountNumber,
      mcxPhone: details.mcxPhone,
      status: 'concluido', // Gravado no histórico de transações
      date: new Date().toISOString(),
      notes: `Transferência realizada para ${details.accountHolder || details.mcxPhone || 'Conta Registada'}`,
    };

    storage.savePayout(transaction);
    refreshData();
    showToast(`Levantamento de ${new Intl.NumberFormat('pt-AO').format(amount)} Kz registado com sucesso no histórico de transações!`, 'success');
    return { success: true };
  };

  const requestVipUpgrade = (storeId: string) => {
    requestVipUpgradeWithPlan(storeId, 'vip_1');
  };

  const requestVipUpgradeWithPlan = (storeId: string, plan: VipPlanType) => {
    const res = storage.requestVipUpgradeWithPlan(storeId, plan);
    if (res.success) {
      refreshData();
      showToast('Pedido de Upgrade VIP enviado com sucesso ao Administrador!', 'success');
    } else {
      showToast(res.error || 'Erro ao enviar pedido VIP.', 'error');
    }
  };

  // PROFILE CLAIMS
  const submitProfileClaim = async (reason: string) => {
    if (!currentUser) return { success: false, error: 'Inicie sessão primeiro.' };
    const res = await storage.createProfileClaim({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhone: currentUser.phone,
      userRole: currentUser.role,
      reason,
      storeId: userStore?.id,
      storeName: userStore?.name,
    });
    if (res.success) {
      refreshData();
      showToast('Pedido de reivindicação submetido com sucesso! A administração irá analisar.', 'success');
      return { success: true };
    }
    showToast(res.error || 'Erro ao submeter reivindicação.', 'error');
    return { success: false, error: res.error };
  };

  const adminApproveProfileClaim = async (claimId: string, notes?: string) => {
    const res = await storage.adminApproveProfileClaim(claimId, notes);
    if (res.success) {
      refreshData();
      showToast('Reivindicação aprovada! O perfil do utilizador foi desbloqueado para 1 edição.', 'success');
      return { success: true };
    }
    showToast(res.error || 'Erro ao aprovar.', 'error');
    return { success: false, error: res.error };
  };

  const adminRejectProfileClaim = async (claimId: string, notes?: string) => {
    const res = await storage.adminRejectProfileClaim(claimId, notes);
    if (res.success) {
      refreshData();
      showToast('Reivindicação rejeitada com registo de motivo.', 'info');
      return { success: true };
    }
    showToast(res.error || 'Erro ao rejeitar.', 'error');
    return { success: false, error: res.error };
  };

  // ADMIN ACTIONS
  const adminApproveStore = (storeId: string) => {
    const store = stores.find((s) => s.id === storeId);
    if (!store) return;

    store.status = 'ativa';
    store.claimReason = undefined;
    storage.saveStore(store);

    storage.addNotification({
      userId: store.ownerId,
      title: 'Loja Aprovada com Sucesso!',
      message: `Parabéns! A sua loja "${store.name}" foi validada e ativada pela administração. Já pode publicar os seus produtos.`,
      type: 'store_approval',
    });

    refreshData();
    showToast(`Loja "${store.name}" aprovada e ativada com sucesso!`, 'success');
  };

  const adminClaimStore = (storeId: string, reason: string) => {
    const store = stores.find((s) => s.id === storeId);
    if (!store) return;

    store.status = 'reivindicada';
    store.claimReason = reason;
    storage.saveStore(store);

    storage.addNotification({
      userId: store.ownerId,
      title: 'Aviso de Inconformidade na Loja',
      message: `A administração da AC Online Kwanza solicitou retificação na loja "${store.name}". Motivo: ${reason}. Por favor atualize os seus dados.`,
      type: 'store_claim',
    });

    refreshData();
    showToast(`Loja reivindicada. Notificação com motivo enviada ao vendedor.`, 'info');
  };

  const adminSuspendStore = (storeId: string, reason: string) => {
    const store = stores.find((s) => s.id === storeId);
    if (!store) return;

    store.status = 'suspensa';
    store.isSuspended = true;
    store.suspensionReason = reason;
    store.suspensionDate = new Date().toISOString();
    store.claimDeadlineDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    storage.saveStore(store);

    refreshData();
    showToast(`Loja "${store.name}" suspensa pela administração.`, 'error');
  };

  const adminReactivateStore = (storeId: string) => {
    adminReactivateStoreWithOptions(storeId, { action: 'manter' });
  };

  const adminReactivateStoreWithOptions = (
    storeId: string,
    options: {
      action: 'trial' | 'vip_1' | 'vip_2' | 'vip_premium' | 'manter';
      trialDays?: number;
      vipPrice?: number;
    }
  ) => {
    const res = storage.adminReactivateStoreWithOptions(storeId, options);
    if (res.success) {
      refreshData();
      showToast(`Loja reativada pela administração com sucesso!`, 'success');
    } else {
      showToast(res.error || 'Erro ao reativar loja.', 'error');
    }
  };

  const adminApproveVip = (storeId: string, priceKz: number) => {
    adminApproveVipWithPlan(storeId, 'vip_1', priceKz, 6);
  };

  const adminApproveVipWithPlan = (
    storeId: string,
    plan: VipPlanType,
    priceKz: number,
    durationMonths?: number
  ) => {
    const res = storage.adminApproveVipWithPlan(storeId, plan, priceKz, durationMonths);
    if (res.success) {
      refreshData();
      showToast(`Plano VIP ativado com sucesso!`, 'success');
    } else {
      showToast(res.error || 'Erro ao ativar plano VIP.', 'error');
    }
  };

  const adminSuspendUser = (userId: string, reason: string) => {
    const users = storage.getRegisteredUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    user.isSuspended = true;
    user.suspensionReason = reason;
    storage.updateUserData(user);

    refreshData();
    showToast(`Utilizador ${user.name} suspenso.`, 'error');
  };

  const adminReactivateUser = (userId: string) => {
    const users = storage.getRegisteredUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    user.isSuspended = false;
    user.suspensionReason = undefined;
    storage.updateUserData(user);

    refreshData();
    showToast(`Utilizador ${user.name} reativado.`, 'success');
  };

  const adminResolveReport = (reportId: string, notes?: string) => {
    storage.updateReportStatus(reportId, 'resolvida', notes);
    refreshData();
    showToast('Denúncia marcada como resolvida.', 'success');
  };

  // CHAT ACTIONS (Isolated Customer <-> Store)
  const openChatWithStore = (storeId: string, productId?: string) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    const store = stores.find((s) => s.id === storeId);
    if (!store) return;

    const convId = `conv_${store.id}_${currentUser.id}`;
    setActiveConversationId(convId);
    setActiveConversationMessages(storage.getMessages(convId));

    // Mark as read for customer
    storage.markConversationRead(convId, 'cliente');

    // Pre-register conversation metadata if product is attached
    if (productId) {
      const prod = products.find((p) => p.id === productId);
      storage.saveMessage(
        convId,
        {
          id: 'msg_sys_' + Date.now(),
          conversationId: convId,
          senderId: 'system',
          senderRole: 'cliente',
          senderName: 'Sistema',
          text: `Conversa iniciada sobre o artigo: ${prod ? prod.name : 'Artigo da loja'}`,
          timestamp: new Date().toISOString(),
        },
        {
          storeId: store.id,
          storeName: store.name,
          customerId: currentUser.id,
          customerName: currentUser.name,
          customerEmail: currentUser.email,
          productId,
          productName: prod?.name,
        }
      );
      setActiveConversationMessages(storage.getMessages(convId));
    }

    setChatDrawerOpen(true);
  };

  const openChatWithCustomer = (storeId: string, customerId: string) => {
    const convId = `conv_${storeId}_${customerId}`;
    setActiveConversationId(convId);
    setActiveConversationMessages(storage.getMessages(convId));
    storage.markConversationRead(convId, 'vendedor');
    setChatDrawerOpen(true);
  };

  const openChatWithAdmin = (storeId?: string) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    const targetStoreId = storeId || userStore?.id;
    if (!targetStoreId) {
      showToast('Nenhuma loja associada encontrada para abrir o chat.', 'error');
      return;
    }
    const convId = `conv_admin_store_${targetStoreId}`;
    setActiveConversationId(convId);
    setActiveConversationMessages(storage.getMessages(convId));
    setChatDrawerOpen(true);
  };

  const sendChatMessage = (text: string) => {
    if (!currentUser || !activeConversationId || !text.trim()) return;

    if (activeConversationId.startsWith('conv_admin_store_')) {
      const targetStoreId = activeConversationId.replace('conv_admin_store_', '');
      const store = stores.find((s) => s.id === targetStoreId);
      const isSenderAdmin = currentUser.role === 'admin';

      const message: ChatMessage = {
        id: 'msg_' + Date.now(),
        conversationId: activeConversationId,
        senderId: currentUser.id,
        senderRole: currentUser.role,
        senderName: isSenderAdmin ? 'Administração AC Online Kwanza' : currentUser.name,
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      storage.saveMessage(activeConversationId, message, {
        storeId: targetStoreId,
        storeName: store?.name || 'Loja',
        customerId: store?.ownerId || 'vendor',
        customerName: isSenderAdmin ? store?.name || 'Vendedor' : currentUser.name,
        customerEmail: isSenderAdmin ? store?.ownerEmail || '' : currentUser.email,
      });

      setActiveConversationMessages((prev) => [...prev, message]);

      const notifyTarget = isSenderAdmin ? store?.ownerId : 'user-admin';
      if (notifyTarget) {
        storage.addNotification({
          userId: notifyTarget,
          title: isSenderAdmin ? 'Nova Mensagem da Administração' : `Mensagem do Vendedor (${store?.name || currentUser.name})`,
          message: `${isSenderAdmin ? 'Administrador' : currentUser.name}: "${text.trim().substring(0, 50)}..."`,
          type: 'chat',
        });
      }
      refreshData();
      return;
    }

    const conv = conversations.find((c) => c.id === activeConversationId);
    const storeId = conv ? conv.storeId : activeConversationId.split('_')[1];
    const customerId = conv ? conv.customerId : activeConversationId.split('_')[2];
    const store = stores.find((s) => s.id === storeId);

    const message: ChatMessage = {
      id: 'msg_' + Date.now(),
      conversationId: activeConversationId,
      senderId: currentUser.id,
      senderRole: currentUser.role,
      senderName: currentUser.name,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    storage.saveMessage(activeConversationId, message, {
      storeId,
      storeName: store?.name || conv?.storeName || 'Loja',
      customerId,
      customerName: conv?.customerName || currentUser.name,
      customerEmail: conv?.customerEmail || currentUser.email,
    });

    // Notify other party
    const targetUserId = currentUser.id === customerId ? store?.ownerId : customerId;
    if (targetUserId) {
      storage.addNotification({
        userId: targetUserId,
        title: `Nova Mensagem no Chat`,
        message: `${currentUser.name}: "${text.trim().substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        type: 'chat',
      });
    }

    setActiveConversationMessages(storage.getMessages(activeConversationId));
    setConversations(storage.getConversations());
  };

  const markConversationAsRead = (conversationId: string) => {
    if (!currentUser) return;
    const byRole = currentUser.role === 'vendedor' ? 'vendedor' : 'cliente';
    storage.markConversationRead(conversationId, byRole);
    setConversations(storage.getConversations());
  };

  // WISHLIST ACTIONS
  const toggleWishlist = (productId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    const isFav = storage.toggleWishlist(currentUser.id, productId);
    setWishlist(storage.getWishlist(currentUser.id));
    showToast(isFav ? 'Artigo adicionado aos favoritos!' : 'Artigo removido dos favoritos.', 'info');
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  // REPORTS
  const openReportModal = (type: 'store' | 'product', id: string, name: string) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setReportTarget({ type, id, name });
    setReportModalOpen(true);
  };

  const submitReport = (reason: string, details: string) => {
    if (!currentUser || !reportTarget) return;

    storage.saveReport({
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reporterEmail: currentUser.email,
      targetType: reportTarget.type,
      targetId: reportTarget.id,
      targetName: reportTarget.name,
      reason,
      details,
    });

    storage.addNotification({
      userId: 'user-admin',
      title: `Nova Denúncia Submetida`,
      message: `Denúncia sobre ${reportTarget.type === 'store' ? 'a loja' : 'o produto'} "${reportTarget.name}" por ${currentUser.name}.`,
      type: 'system',
    });

    setReportModalOpen(false);
    setReportTarget(null);
    refreshData();
    showToast('A sua denúncia foi registada e será auditada pelo administrador geral.', 'info');
  };

  // PRODUCT DETAIL MODAL
  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setProductDetailModalOpen(true);
  };

  const closeProductDetail = () => {
    setSelectedProduct(null);
    setProductDetailModalOpen(false);
  };

  // INVOICE MODAL
  const openInvoiceModal = (order: Order) => {
    setSelectedOrderForInvoice(order);
    setInvoiceModalOpen(true);
  };

  const closeInvoiceModal = () => {
    setSelectedOrderForInvoice(null);
    setInvoiceModalOpen(false);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAdmin,
        isVendor,
        isClient,
        userStore,
        login,
        register,
        verifyRegistrationCode,
        resendRegistrationCode,
        requestPasswordReset,
        logout,
        changePassword,
        loginWithGoogle,
        updateProfile,
        createPasswordForGoogle,

        stores,
        products,
        orders,
        payouts,
        conversations,
        notifications,
        reports,
        wishlist,

        currentView,
        setCurrentView,
        selectedCategory,
        setSelectedCategory,
        selectedProvince,
        setSelectedProvince,
        searchQuery,
        setSearchQuery,
        filterStoreId,
        setFilterStoreId,

        cart,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,

        placeOrder,
        uploadPaymentProof,
        verifyOrderPayment,
        updateOrderStatus,

        saveStoreProfile,
        saveStoreProduct,
        deleteStoreProduct,
        requestPayout,
        requestVipUpgrade,
        requestVipUpgradeWithPlan,

        profileClaims,
        claimProfileModalOpen,
        setClaimProfileModalOpen,
        submitProfileClaim,
        adminApproveProfileClaim,
        adminRejectProfileClaim,

        adminApproveStore,
        adminClaimStore,
        adminSuspendStore,
        adminReactivateStore,
        adminReactivateStoreWithOptions,
        adminApproveVip,
        adminApproveVipWithPlan,
        adminSuspendUser,
        adminReactivateUser,
        adminResolveReport,
        checkStoreSuspensions,

        openChatWithStore,
        openChatWithCustomer,
        openChatWithAdmin,
        activeConversationId,
        activeConversationMessages,
        sendChatMessage,
        markConversationAsRead,

        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        authModalRole,
        setAuthModalRole,

        cartDrawerOpen,
        setCartDrawerOpen,
        checkoutModalOpen,
        setCheckoutModalOpen,
        ordersModalOpen,
        setOrdersModalOpen,
        chatDrawerOpen,
        setChatDrawerOpen,
        notificationsDrawerOpen,
        setNotificationsDrawerOpen,
        changePasswordModalOpen,
        setChangePasswordModalOpen,
        profileModalOpen,
        setProfileModalOpen,
        confirmPasswordReset,
        isPasswordRecovery,
        setIsPasswordRecovery,
        recoveryEmail,
        setRecoveryEmail,
        reportModalOpen,
        setReportModalOpen,
        reportTarget,
        openReportModal,
        submitReport,

        productDetailModalOpen,
        selectedProduct,
        openProductDetail,
        closeProductDetail,

        invoiceModalOpen,
        selectedOrderForInvoice,
        openInvoiceModal,
        closeInvoiceModal,

        toggleWishlist,
        isInWishlist,

        toasts,
        showToast,
        removeToast,

        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
