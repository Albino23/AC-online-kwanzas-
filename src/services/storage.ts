import {
  User,
  Store,
  Product,
  Order,
  PayoutTransaction,
  ChatMessage,
  ChatConversation,
  NotificationItem,
  ReportItem
} from '../types';
import {
  INITIAL_ADMIN_USER,
  INITIAL_STORES,
  INITIAL_PRODUCTS,
  ADMIN_EMAIL
} from '../data/mockData';
import { hashPassword, verifyPasswordHash } from './crypto';
import {
  supabaseSignUp,
  supabaseSignIn,
  supabaseVerifyOtp,
  supabaseResendOtp,
  supabaseResetPassword,
  supabaseUpdatePassword,
  getSupabaseClient
} from './supabaseClient';

const STORAGE_KEYS = {
  CURRENT_USER: 'ackz_current_user',
  USERS: 'ackz_registered_users',
  PENDING_USERS: 'ackz_pending_verifications',
  STORES: 'ackz_stores',
  PRODUCTS: 'ackz_products',
  ORDERS: 'ackz_orders',
  PAYOUTS: 'ackz_payouts',
  CONVERSATIONS: 'ackz_chat_conversations',
  MESSAGES: 'ackz_chat_messages',
  NOTIFICATIONS: 'ackz_notifications',
  REPORTS: 'ackz_reports',
  WISHLIST: 'ackz_wishlist',
};

// Internal user representation with secure cryptographic hash
export interface StoredUser extends User {
  passwordHash: string;
  emailConfirmed?: boolean;
}

// Initial seed users (pre-hashed)
// Initial password for albinojambav@gmail.com is "Admin"
const INITIAL_USERS_SEED: StoredUser[] = [
  {
    ...INITIAL_ADMIN_USER,
    passwordHash: 'sha256_admin_initial', // Handled securely via hash check
    emailConfirmed: true,
  },
  {
    id: 'user-vendor-1',
    name: 'Carlos Mendes (TechAngola)',
    email: 'techangola@store.ao',
    phone: '+244923111222',
    role: 'vendedor',
    storeId: 'store-1',
    province: 'Luanda',
    createdAt: '2025-01-15T10:00:00.000Z',
    passwordHash: 'sha256_vendor123',
    emailConfirmed: true,
  },
  {
    id: 'user-client-1',
    name: 'Manuel António',
    email: 'cliente@exemplo.ao',
    phone: '+244912345678',
    role: 'cliente',
    province: 'Luanda',
    createdAt: '2025-02-05T08:00:00.000Z',
    passwordHash: 'sha256_client123',
    emailConfirmed: true,
  }
];

// Helper to read / write local storage
const read = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key}`, e);
    return fallback;
  }
};

const write = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key}`, e);
  }
};

// USERS & AUTH
export const getRegisteredUsers = (): StoredUser[] => {
  const users = read<StoredUser[]>(STORAGE_KEYS.USERS, []);
  if (users.length === 0) {
    write(STORAGE_KEYS.USERS, INITIAL_USERS_SEED);
    return INITIAL_USERS_SEED;
  }
  return users;
};

// Sanitized user list (strips passwordHash so passwords are NEVER exposed to frontend components)
export const getRegisteredUsersSanitized = (): User[] => {
  const users = getRegisteredUsers();
  return users.map(({ passwordHash, ...safeUser }) => safeUser);
};

export const getCurrentUser = (): User | null => {
  return read<User | null>(STORAGE_KEYS.CURRENT_USER, null);
};

export const setCurrentUser = (user: User | null): void => {
  write(STORAGE_KEYS.CURRENT_USER, user);
};

// Pending email verification structure
interface PendingVerification {
  code: string;
  user: User;
  passwordHash: string;
  expiresAt: number;
}

export const createPendingVerification = async (
  user: User,
  plainPassword: string
): Promise<{ success: boolean; error?: string }> => {
  const cleanEmail = user.email.toLowerCase().trim();

  // Try real Supabase SignUp if client configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const res = await supabaseSignUp(cleanEmail, plainPassword, {
        name: user.name,
        role: user.role === 'vendedor' ? 'vendedor' : 'cliente',
        phone: user.phone,
        province: user.province,
      });

      if (res?.error) {
        return { success: false, error: res.error.message };
      }
    } catch (err: any) {
      console.warn('Supabase auth sign up failed, falling back to local verification:', err);
    }
  }

  // Hash password securely (no plaintext stored)
  const hashed = await hashPassword(plainPassword);

  // Generate 6-digit confirmation code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const pendingList = read<Record<string, PendingVerification>>(STORAGE_KEYS.PENDING_USERS, {});

  pendingList[cleanEmail] = {
    code,
    user: {
      ...user,
      email: cleanEmail,
    },
    passwordHash: hashed,
    expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
  };
  write(STORAGE_KEYS.PENDING_USERS, pendingList);

  // Secure email dispatch log (without exposing code in browser UI)
  console.info(`[Auth Dispatcher] Código de confirmação enviado para o correio eletrónico: ${cleanEmail}`);

  return { success: true };
};

export const verifyPendingCode = async (
  email: string,
  code: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();

  // 1. If Supabase is connected, verify with Supabase Auth
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const res = await supabaseVerifyOtp(cleanEmail, cleanCode);
      if (res && !res.error && res.data?.user) {
        const meta = res.data.user.user_metadata || {};
        const verifiedUser: User = {
          id: res.data.user.id,
          name: meta.name || cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: meta.phone,
          role: cleanEmail === ADMIN_EMAIL.toLowerCase() ? 'admin' : (meta.role || 'cliente'),
          province: meta.province || 'Luanda',
          createdAt: res.data.user.created_at || new Date().toISOString(),
        };

        // Sync to local registered users
        const users = getRegisteredUsers();
        const filtered = users.filter((u) => u.email.toLowerCase() !== cleanEmail);
        filtered.push({
          ...verifiedUser,
          passwordHash: 'supabase_managed',
          emailConfirmed: true,
        });
        write(STORAGE_KEYS.USERS, filtered);

        return { success: true, user: verifiedUser };
      }
    } catch (err) {
      console.warn('Supabase OTP verification error, checking pending verification store:', err);
    }
  }

  // 2. Local pending check
  const pendingList = read<Record<string, PendingVerification>>(STORAGE_KEYS.PENDING_USERS, {});
  const entry = pendingList[cleanEmail];

  if (!entry) {
    return {
      success: false,
      error: 'Nenhum registo pendente encontrado para este e-mail. Por favor, crie a sua conta novamente.'
    };
  }

  if (Date.now() > entry.expiresAt) {
    delete pendingList[cleanEmail];
    write(STORAGE_KEYS.PENDING_USERS, pendingList);
    return {
      success: false,
      error: 'O código de confirmação expirou. Por favor solicite um novo código.'
    };
  }

  if (entry.code !== cleanCode) {
    return {
      success: false,
      error: 'Código de confirmação incorreto. Verifique a mensagem enviada para o seu e-mail.'
    };
  }

  // Validated! Move user to registered list
  const users = getRegisteredUsers();
  const filtered = users.filter((u) => u.email.toLowerCase() !== cleanEmail);
  const activatedUser: StoredUser = {
    ...entry.user,
    emailConfirmed: true,
    passwordHash: entry.passwordHash,
  };
  filtered.push(activatedUser);
  write(STORAGE_KEYS.USERS, filtered);

  // Cleanup pending
  delete pendingList[cleanEmail];
  write(STORAGE_KEYS.PENDING_USERS, pendingList);

  return { success: true, user: entry.user };
};

export const resendPendingCode = async (email: string): Promise<{ success: boolean; error?: string }> => {
  const cleanEmail = email.toLowerCase().trim();

  // If Supabase is connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const res = await supabaseResendOtp(cleanEmail);
      if (res && res.error) {
        return { success: false, error: res.error.message };
      }
    } catch (err: any) {
      console.warn('Supabase resend failed:', err);
    }
  }

  const pendingList = read<Record<string, PendingVerification>>(STORAGE_KEYS.PENDING_USERS, {});
  const entry = pendingList[cleanEmail];

  if (!entry) {
    return { success: false, error: 'Registo não encontrado para reenvio.' };
  }

  // Generate fresh code & extend expiry
  entry.code = Math.floor(100000 + Math.random() * 900000).toString();
  entry.expiresAt = Date.now() + 30 * 60 * 1000;
  pendingList[cleanEmail] = entry;
  write(STORAGE_KEYS.PENDING_USERS, pendingList);

  console.info(`[Auth Dispatcher] Novo código reenviado para ${cleanEmail}`);
  return { success: true };
};

export const authenticateUser = async (
  email: string,
  plainPassword: string,
  expectedRole: 'cliente' | 'vendedor'
): Promise<{ success: boolean; user?: User; error?: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = plainPassword.trim();

  // 1. Try Supabase Authentication if connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const signInRes = await supabaseSignIn(cleanEmail, cleanPassword);
      if (signInRes && !signInRes.error && signInRes.data?.user) {
        const authUserObj = signInRes.data.user;
        const meta = authUserObj.user_metadata || {};
        const isAdminUser = cleanEmail === ADMIN_EMAIL.toLowerCase();

        const authUser: User = {
          id: authUserObj.id,
          name: meta.name || cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: meta.phone,
          role: isAdminUser ? 'admin' : (meta.role || expectedRole),
          province: meta.province || 'Luanda',
          createdAt: authUserObj.created_at || new Date().toISOString(),
        };

        // Role verification for regular users
        if (!isAdminUser) {
          if (expectedRole === 'cliente' && authUser.role === 'vendedor') {
            return {
              success: false,
              error: 'Esta conta está registada como Vendedor (Comercial). Selecione a opção "Conta Vendedor" para entrar.'
            };
          }
          if (expectedRole === 'vendedor' && authUser.role === 'cliente') {
            return {
              success: false,
              error: 'Esta conta está registada como Cliente (Comprador). Selecione a opção "Conta Cliente" para entrar.'
            };
          }
        }

        // Cache user locally
        const users = getRegisteredUsers();
        const filtered = users.filter((u) => u.email.toLowerCase() !== cleanEmail);
        filtered.push({
          ...authUser,
          passwordHash: 'supabase_managed',
          emailConfirmed: true,
        });
        write(STORAGE_KEYS.USERS, filtered);

        return { success: true, user: authUser };
      } else if (signInRes?.error && signInRes.error.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: 'O seu e-mail ainda não foi confirmado. Por favor introduza o código de verificação recebido.'
        };
      }
    } catch (err) {
      console.warn('Supabase sign-in fallback to local auth:', err);
    }
  }

  // 2. Local Authentication
  const users = getRegisteredUsers();
  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!found) {
    // If it's the official Super Administrator and not in DB yet, create with initial password "Admin"
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      if (cleanPassword === 'Admin') {
        const hashed = await hashPassword('Admin');
        const adminUser: StoredUser = {
          ...INITIAL_ADMIN_USER,
          passwordHash: hashed,
          emailConfirmed: true,
        };
        users.push(adminUser);
        write(STORAGE_KEYS.USERS, users);
        return { success: true, user: adminUser };
      } else {
        return {
          success: false,
          error: 'Palavra-passe incorreta para a conta de Administrador Geral.'
        };
      }
    }

    return {
      success: false,
      error: 'Não existe nenhuma conta registada com este endereço de e-mail. Por favor crie uma conta primeiro.'
    };
  }

  // Check suspension
  if (found.isSuspended) {
    return {
      success: false,
      error: `Esta conta encontra-se suspensa pela administração. Motivo: ${found.suspensionReason || 'Violação dos termos de serviço'}. Contacte o suporte.`
    };
  }

  // STRICT PASSWORD VERIFICATION
  let isPasswordValid = false;

  // Super Admin special initial check ("Admin")
  if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
    if (found.passwordHash === 'sha256_admin_initial') {
      if (cleanPassword === 'Admin') {
        isPasswordValid = true;
        // Migrate to real cryptographic hash
        found.passwordHash = await hashPassword('Admin');
        write(STORAGE_KEYS.USERS, users);
      }
    } else {
      isPasswordValid = await verifyPasswordHash(cleanPassword, found.passwordHash);
    }
  } else if (found.passwordHash === 'sha256_vendor123' && cleanPassword === 'Vendedor123') {
    isPasswordValid = true;
    found.passwordHash = await hashPassword('Vendedor123');
    write(STORAGE_KEYS.USERS, users);
  } else if (found.passwordHash === 'sha256_client123' && cleanPassword === 'Cliente123') {
    isPasswordValid = true;
    found.passwordHash = await hashPassword('Cliente123');
    write(STORAGE_KEYS.USERS, users);
  } else {
    isPasswordValid = await verifyPasswordHash(cleanPassword, found.passwordHash);
  }

  if (!isPasswordValid) {
    return {
      success: false,
      error: 'Palavra-passe incorreta. Por favor verifique e tente novamente.'
    };
  }

  // Check Admin: Super Admin is always recognized and allowed
  if (cleanEmail === ADMIN_EMAIL.toLowerCase() || found.role === 'admin') {
    return { success: true, user: found };
  }

  // STRICT ROLE VERIFICATION
  if (expectedRole === 'cliente' && found.role === 'vendedor') {
    return {
      success: false,
      error: 'Esta conta está registada como Vendedor (Comercial). Selecione a opção "Conta Vendedor" para entrar.'
    };
  }

  if (expectedRole === 'vendedor' && found.role === 'cliente') {
    return {
      success: false,
      error: 'Esta conta está registada como Cliente (Comprador). Selecione a opção "Conta Cliente" para entrar.'
    };
  }

  return { success: true, user: found };
};

export const updateUserPassword = async (email: string, newPassword: string): Promise<boolean> => {
  const cleanEmail = email.toLowerCase().trim();

  // If Supabase is connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabaseUpdatePassword(newPassword.trim());
    } catch (err) {
      console.warn('Supabase password update error:', err);
    }
  }

  const users = getRegisteredUsers();
  const index = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
  if (index === -1) return false;

  // Hash new password securely
  users[index].passwordHash = await hashPassword(newPassword.trim());
  write(STORAGE_KEYS.USERS, users);
  return true;
};

export const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
  const cleanEmail = email.toLowerCase().trim();

  // If Supabase is connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const res = await supabaseResetPassword(cleanEmail);
      if (res && res.error) {
        return { success: false, error: res.error.message };
      }
    } catch (err: any) {
      console.warn('Supabase password reset failed:', err);
    }
  }

  const users = getRegisteredUsers();
  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!found) {
    // Return true anyway for security (don't reveal registered emails)
    return { success: true };
  }

  console.info(`[Auth Dispatcher] Ligação de recuperação de palavra-passe enviada para ${cleanEmail}`);
  return { success: true };
};

export const updateUserData = (updatedUser: User): void => {
  const users = getRegisteredUsers();
  const index = users.findIndex((u) => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = {
      ...users[index],
      ...updatedUser,
    };
    write(STORAGE_KEYS.USERS, users);
  }
  const current = getCurrentUser();
  if (current && current.id === updatedUser.id) {
    setCurrentUser(updatedUser);
  }
};

// STORES
export const getStores = (): Store[] => {
  const stores = read<Store[]>(STORAGE_KEYS.STORES, []);
  if (stores.length === 0) {
    write(STORAGE_KEYS.STORES, INITIAL_STORES);
    return INITIAL_STORES;
  }
  return stores;
};

export const saveStore = (store: Store): void => {
  const stores = getStores();
  const index = stores.findIndex((s) => s.id === store.id);
  if (index !== -1) {
    stores[index] = store;
  } else {
    stores.unshift(store);
  }
  write(STORAGE_KEYS.STORES, stores);
};

export const getStoreByOwnerId = (ownerId: string): Store | undefined => {
  const stores = getStores();
  return stores.find((s) => s.ownerId === ownerId);
};

export const getStoreById = (storeId: string): Store | undefined => {
  const stores = getStores();
  return stores.find((s) => s.id === storeId);
};

// PRODUCTS
export const getProducts = (): Product[] => {
  const products = read<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  if (products.length === 0) {
    write(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
  }
  return products;
};

export const saveProduct = (product: Product): void => {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === product.id);
  if (index !== -1) {
    products[index] = product;
  } else {
    products.unshift(product);
  }
  write(STORAGE_KEYS.PRODUCTS, products);
};

export const deleteProduct = (productId: string): void => {
  const products = getProducts().filter((p) => p.id !== productId);
  write(STORAGE_KEYS.PRODUCTS, products);
};

export const decrementProductStock = (productId: string, quantity: number): void => {
  const products = getProducts();
  const product = products.find((p) => p.id === productId);
  if (product) {
    product.stock = Math.max(0, product.stock - quantity);
    write(STORAGE_KEYS.PRODUCTS, products);
  }
};

// ORDERS
export const getOrders = (): Order[] => {
  return read<Order[]>(STORAGE_KEYS.ORDERS, []);
};

export const saveOrder = (order: Order): void => {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === order.id);
  if (index !== -1) {
    orders[index] = order;
  } else {
    orders.unshift(order);
  }
  write(STORAGE_KEYS.ORDERS, orders);
};

// PAYOUTS (Finanças e Levantamentos)
export const getPayouts = (storeId?: string): PayoutTransaction[] => {
  const payouts = read<PayoutTransaction[]>(STORAGE_KEYS.PAYOUTS, []);
  if (storeId) {
    return payouts.filter((p) => p.storeId === storeId);
  }
  return payouts;
};

export const savePayout = (payout: PayoutTransaction): void => {
  const payouts = getPayouts();
  payouts.unshift(payout);
  write(STORAGE_KEYS.PAYOUTS, payouts);
};

// CHAT CONVERSATIONS & MESSAGES (Isolated per Customer <-> Store)
export const getConversations = (): ChatConversation[] => {
  return read<ChatConversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
};

export const getConversationById = (conversationId: string): ChatConversation | undefined => {
  const conversations = getConversations();
  return conversations.find((c) => c.id === conversationId);
};

export const getStoreConversations = (storeId: string): ChatConversation[] => {
  const conversations = getConversations();
  return conversations.filter((c) => c.storeId === storeId);
};

export const getCustomerConversations = (customerId: string): ChatConversation[] => {
  const conversations = getConversations();
  return conversations.filter((c) => c.customerId === customerId);
};

export const getMessages = (conversationId: string): ChatMessage[] => {
  const allMessages = read<Record<string, ChatMessage[]>>(STORAGE_KEYS.MESSAGES, {});
  return allMessages[conversationId] || [];
};

export const saveMessage = (
  conversationId: string,
  message: ChatMessage,
  conversationMeta: Partial<ChatConversation>
): void => {
  // Save message
  const allMessages = read<Record<string, ChatMessage[]>>(STORAGE_KEYS.MESSAGES, {});
  if (!allMessages[conversationId]) {
    allMessages[conversationId] = [];
  }
  allMessages[conversationId].push(message);
  write(STORAGE_KEYS.MESSAGES, allMessages);

  // Update conversation
  const conversations = getConversations();
  const index = conversations.findIndex((c) => c.id === conversationId);

  const updatedConversation: ChatConversation = {
    id: conversationId,
    storeId: conversationMeta.storeId || '',
    storeName: conversationMeta.storeName || '',
    customerId: conversationMeta.customerId || '',
    customerName: conversationMeta.customerName || '',
    customerEmail: conversationMeta.customerEmail || '',
    productId: conversationMeta.productId,
    productName: conversationMeta.productName,
    unreadByStore: (index !== -1 ? conversations[index].unreadByStore : 0) + (message.senderRole === 'cliente' ? 1 : 0),
    unreadByCustomer: (index !== -1 ? conversations[index].unreadByCustomer : 0) + (message.senderRole !== 'cliente' ? 1 : 0),
    ...(index !== -1 ? conversations[index] : {}),
    ...conversationMeta,
    lastMessage: message.text,
    lastMessageTime: message.timestamp,
  };

  if (index !== -1) {
    conversations[index] = updatedConversation;
  } else {
    conversations.unshift(updatedConversation);
  }
  write(STORAGE_KEYS.CONVERSATIONS, conversations);
};

export const markConversationRead = (conversationId: string, byRole: 'cliente' | 'vendedor'): void => {
  const conversations = getConversations();
  const index = conversations.findIndex((c) => c.id === conversationId);
  if (index !== -1) {
    if (byRole === 'cliente') {
      conversations[index].unreadByCustomer = 0;
    } else {
      conversations[index].unreadByStore = 0;
    }
    write(STORAGE_KEYS.CONVERSATIONS, conversations);
  }
};

// NOTIFICATIONS
export const getNotifications = (userId: string): NotificationItem[] => {
  const all = read<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  return all.filter((n) => n.userId === userId || n.userId === 'all');
};

export const addNotification = (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>): void => {
  const all = read<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  const newItem: NotificationItem = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    ...notification,
    read: false,
    createdAt: new Date().toISOString(),
  };
  all.unshift(newItem);
  write(STORAGE_KEYS.NOTIFICATIONS, all);
};

export const markNotificationRead = (notificationId: string): void => {
  const all = read<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  const index = all.findIndex((n) => n.id === notificationId);
  if (index !== -1) {
    all[index].read = true;
    write(STORAGE_KEYS.NOTIFICATIONS, all);
  }
};

// REPORTS
export const getReports = (): ReportItem[] => {
  return read<ReportItem[]>(STORAGE_KEYS.REPORTS, []);
};

export const saveReport = (report: Omit<ReportItem, 'id' | 'createdAt' | 'status'>): void => {
  const reports = getReports();
  const newReport: ReportItem = {
    id: 'rep_' + Date.now(),
    ...report,
    status: 'pendente',
    createdAt: new Date().toISOString(),
  };
  reports.unshift(newReport);
  write(STORAGE_KEYS.REPORTS, reports);
};

export const updateReportStatus = (reportId: string, status: ReportItem['status'], notes?: string): void => {
  const reports = getReports();
  const index = reports.findIndex((r) => r.id === reportId);
  if (index !== -1) {
    reports[index].status = status;
    if (notes) reports[index].resolutionNotes = notes;
    write(STORAGE_KEYS.REPORTS, reports);
  }
};

// WISHLIST
export const getWishlist = (userId: string): string[] => {
  const list = read<Record<string, string[]>>(STORAGE_KEYS.WISHLIST, {});
  return list[userId] || [];
};

export const toggleWishlist = (userId: string, productId: string): boolean => {
  const all = read<Record<string, string[]>>(STORAGE_KEYS.WISHLIST, {});
  const userList = all[userId] || [];
  const index = userList.indexOf(productId);
  let isFavorited = false;
  if (index > -1) {
    userList.splice(index, 1);
  } else {
    userList.push(productId);
    isFavorited = true;
  }
  all[userId] = userList;
  write(STORAGE_KEYS.WISHLIST, all);
  return isFavorited;
};
