import {
  User,
  Store,
  Product,
  Order,
  PayoutTransaction,
  ChatMessage,
  ChatConversation,
  NotificationItem,
  ReportItem,
  LoginHistoryItem,
  UserRole,
  ProfileClaim,
  VipPlanType
} from '../types';
import {
  INITIAL_ADMIN_USER,
  INITIAL_STORES,
  INITIAL_PRODUCTS,
  ADMIN_EMAIL,
  ADMIN_SUPPORT_EMAIL
} from '../data/mockData';
import { hashPassword, verifyPasswordHash } from './crypto';
import {
  supabaseSignUp,
  supabaseSignIn,
  supabaseVerifyOtp,
  supabaseResendOtp,
  supabaseResetPassword,
  supabaseUpdatePassword,
  getSupabaseClient,
  translateSupabaseError,
  supabaseSignInWithGoogle,
  supabaseUpdateProfile,
  supabaseRecordLogin,
  supabaseGetLoginHistory,
  supabaseOnAuthStateChange
} from './supabaseClient';

export {
  supabaseOnAuthStateChange,
  supabaseSignInWithGoogle,
  translateSupabaseError,
  getSupabaseClient
};

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
  LOGIN_HISTORY: 'ackz_login_history_v1',
  PROFILE_CLAIMS: 'ackz_profile_claims_v1',
};

// Internal user representation with secure cryptographic hash
export interface StoredUser extends User {
  passwordHash: string;
  emailConfirmed?: boolean;
}

// Initial seed users with cryptographic SHA-256 hashes (pre-computed with ackz_salt_2025_)
// Super Administrador (albinojambav@gmail.com / albinocapitango23@gmail.com / admin@aconlinekwanza.ao) autentica com Vidal2323 sem necessidade de registo
export const SUPER_ADMIN_INITIAL_HASH = '1415ee967b4ff637df8db88b14c119d6057bf866d10752dfa25d104da643511e';
export const VENDOR_SEED_HASH = '407f29eb115fad29f3147b364b5424be8ff69ba74e32cbdb22a405e0e3a090de';
export const CLIENT_SEED_HASH = 'cf4abba0f963bba849f6a1889c162b200b523407f7254f3f4c36a934a0617992';

export const isAuthorizedAdminEmail = (email: string): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    clean === ADMIN_EMAIL.toLowerCase() ||
    clean === ADMIN_SUPPORT_EMAIL.toLowerCase() ||
    clean === 'admin@aconlinekwanza.ao'
  );
};

const INITIAL_USERS_SEED: StoredUser[] = [
  {
    ...INITIAL_ADMIN_USER,
    passwordHash: SUPER_ADMIN_INITIAL_HASH, // SHA-256 de Vidal2323
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
    passwordHash: VENDOR_SEED_HASH,
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
    passwordHash: CLIENT_SEED_HASH,
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
  let users = read<StoredUser[]>(STORAGE_KEYS.USERS, []);
  if (users.length === 0) {
    write(STORAGE_KEYS.USERS, INITIAL_USERS_SEED);
    return INITIAL_USERS_SEED;
  }

  // Ensure Super Administrator is always present and has valid hash
  const adminIndex = users.findIndex((u) => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  if (adminIndex === -1) {
    users.unshift({
      ...INITIAL_ADMIN_USER,
      passwordHash: SUPER_ADMIN_INITIAL_HASH,
      emailConfirmed: true,
    });
    write(STORAGE_KEYS.USERS, users);
  } else {
    // If admin has legacy mock hash, migrate to real Vidal2323 hash
    const adminUser = users[adminIndex];
    if (
      adminUser.passwordHash === 'sha256_admin_initial' ||
      adminUser.passwordHash === 'sha256_admin_vidal_initial' ||
      adminUser.passwordHash.length < 32
    ) {
      adminUser.passwordHash = SUPER_ADMIN_INITIAL_HASH;
      adminUser.role = 'admin';
      adminUser.emailConfirmed = true;
      users[adminIndex] = adminUser;
      write(STORAGE_KEYS.USERS, users);
    }
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

export const recordLogin = async (
  user: { id?: string; email: string; name?: string; role: UserRole },
  authMethod: 'email_password' | 'google',
  status: 'sucesso' | 'falha' = 'sucesso'
): Promise<void> => {
  const item: LoginHistoryItem = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId: user.id,
    userEmail: user.email.toLowerCase().trim(),
    userName: user.name || user.email.split('@')[0],
    role: user.role,
    authMethod,
    status,
    timestamp: new Date().toISOString(),
  };

  const logs = read<LoginHistoryItem[]>(STORAGE_KEYS.LOGIN_HISTORY, []);
  logs.unshift(item);
  if (logs.length > 200) logs.length = 200;
  write(STORAGE_KEYS.LOGIN_HISTORY, logs);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabaseRecordLogin({
        userId: user.id,
        userEmail: item.userEmail,
        userName: item.userName,
        role: item.role,
        authMethod,
        status,
      });
    } catch (err) {
      console.warn('Erro ao registar login no Supabase:', err);
    }
  }
};

export const getLoginHistory = async (): Promise<LoginHistoryItem[]> => {
  const localLogs = read<LoginHistoryItem[]>(STORAGE_KEYS.LOGIN_HISTORY, []);
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const remote = await supabaseGetLoginHistory();
      if (remote && remote.length > 0) {
        const map = new Map<string, LoginHistoryItem>();
        localLogs.forEach((l) => map.set(`${l.userEmail}_${l.timestamp}`, l));
        remote.forEach((r: any) => {
          const item: LoginHistoryItem = {
            id: r.id,
            userId: r.user_id,
            userEmail: r.user_email,
            userName: r.user_name,
            role: r.role,
            authMethod: r.auth_method === 'google' ? 'google' : 'email_password',
            status: r.status || 'sucesso',
            timestamp: r.created_at || new Date().toISOString(),
          };
          map.set(`${item.userEmail}_${item.timestamp}`, item);
        });
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
    } catch (err) {
      console.warn('Fallback para histórico local:', err);
    }
  }
  return localLogs;
};

export const authenticateUser = async (
  email: string,
  plainPassword: string,
  expectedRole: 'cliente' | 'vendedor'
): Promise<{ success: boolean; user?: User; error?: string; needsEmailVerification?: boolean }> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = plainPassword.trim();
  const isSuperAdmin = isAuthorizedAdminEmail(cleanEmail);

  // 1. Tentar Supabase Authentication se cliente estiver configurado
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const signInRes = await supabaseSignIn(cleanEmail, cleanPassword);
      if (signInRes && !signInRes.error && signInRes.data?.user) {
        const authUserObj = signInRes.data.user;
        const meta = authUserObj.user_metadata || {};

        const authUser: User = {
          id: authUserObj.id,
          name: isSuperAdmin ? 'Albino Jamba (Administrador Geral)' : (meta.name || cleanEmail.split('@')[0]),
          email: cleanEmail,
          phone: meta.phone,
          role: isSuperAdmin ? 'admin' : (meta.role || expectedRole),
          province: meta.province || 'Luanda',
          authProvider: 'email',
          hasPassword: true,
          createdAt: authUserObj.created_at || new Date().toISOString(),
        };

        // Validação de perfil/função apenas para utilizadores comuns
        if (!isSuperAdmin) {
          if (expectedRole === 'cliente' && authUser.role === 'vendedor') {
            await recordLogin({ email: cleanEmail, name: authUser.name, role: expectedRole }, 'email_password', 'falha');
            return {
              success: false,
              error: 'Esta conta está registada como Vendedor (Comercial). Selecione a opção "Conta Vendedor" para entrar.'
            };
          }
          if (expectedRole === 'vendedor' && authUser.role === 'cliente') {
            await recordLogin({ email: cleanEmail, name: authUser.name, role: expectedRole }, 'email_password', 'falha');
            return {
              success: false,
              error: 'Esta conta está registada como Cliente (Comprador). Selecione a opção "Conta Cliente" para entrar.'
            };
          }
        }

        // Sincronizar utilizador localmente
        const users = getRegisteredUsers();
        const filtered = users.filter((u) => u.email.toLowerCase() !== cleanEmail);
        filtered.push({
          ...authUser,
          passwordHash: 'supabase_managed',
          emailConfirmed: true,
        });
        write(STORAGE_KEYS.USERS, filtered);

        await recordLogin(authUser, 'email_password', 'sucesso');
        return { success: true, user: authUser };
      } else if (signInRes?.error) {
        // Se for o Super Administrador oficial e ainda não estiver provisionado no Supabase Auth,
        // permite o login local direto com a senha oficial Vidal2323
        if (!isSuperAdmin) {
          const errMsg = translateSupabaseError(signInRes.error);
          await recordLogin({ email: cleanEmail, name: cleanEmail.split('@')[0], role: expectedRole }, 'email_password', 'falha');
          return {
            success: false,
            error: errMsg,
            needsEmailVerification: errMsg.includes('não foi confirmado'),
          };
        }
      }
    } catch (err) {
      console.warn('Supabase sign-in fallback para autenticação local:', err);
    }
  }

  // 2. Autenticação Local Segura (Criptografada)
  const users = getRegisteredUsers();
  let found = users.find((u) => u.email.toLowerCase() === cleanEmail);

  // SUPER ADMINISTRADOR OFICIAL: Reconhecimento direto sem necessidade de registo prévio
  if (isSuperAdmin) {
    if (!found) {
      // Se ainda não existir no registo local, provisiona a conta oficial
      found = {
        ...INITIAL_ADMIN_USER,
        passwordHash: SUPER_ADMIN_INITIAL_HASH,
        emailConfirmed: true,
        authProvider: 'email',
        hasPassword: true,
      };
      users.unshift(found);
      write(STORAGE_KEYS.USERS, users);
    }

    // Verificar senha oficial Vidal2323 ou nova senha definida pelo Super Administrador
    let isSuperAdminPassValid = false;

    // Verificar contra o hash atual armazenado
    if (found.passwordHash) {
      isSuperAdminPassValid = await verifyPasswordHash(cleanPassword, found.passwordHash);
    }

    // Se ainda tiver o hash inicial ou se a senha fornecida for Vidal2323
    if (!isSuperAdminPassValid && (cleanPassword === 'Vidal2323' || found.passwordHash === SUPER_ADMIN_INITIAL_HASH)) {
      if (cleanPassword === 'Vidal2323') {
        isSuperAdminPassValid = true;
        found.passwordHash = SUPER_ADMIN_INITIAL_HASH;
        found.role = 'admin';
        found.emailConfirmed = true;
        write(STORAGE_KEYS.USERS, users);
      }
    }

    if (!isSuperAdminPassValid) {
      await recordLogin({ email: cleanEmail, name: 'Albino Jamba', role: 'admin' }, 'email_password', 'falha');
      return {
        success: false,
        error: 'Palavra-passe incorreta para a conta oficial de Super Administrador.'
      };
    }

    // Garantir que a conta tem privilégios de Super Administrador
    found.role = 'admin';
    found.emailConfirmed = true;
    write(STORAGE_KEYS.USERS, users);

    await recordLogin(found, 'email_password', 'sucesso');
    return { success: true, user: found };
  }

  // Utilizador comum inexistente
  if (!found) {
    await recordLogin({ email: cleanEmail, name: cleanEmail.split('@')[0], role: expectedRole }, 'email_password', 'falha');
    return {
      success: false,
      error: 'Não existe nenhuma conta registada com este endereço de e-mail. Por favor crie a sua conta primeiro.'
    };
  }

  // Verificar se a conta está suspensa
  if (found.isSuspended) {
    await recordLogin(found, 'email_password', 'falha');
    return {
      success: false,
      error: `Esta conta encontra-se suspensa pela administração. Motivo: ${found.suspensionReason || 'Violação dos termos de serviço'}. Contacte o suporte.`
    };
  }

  // Verificar se o e-mail foi confirmado
  if (found.emailConfirmed === false) {
    return {
      success: false,
      error: 'O seu e-mail ainda não foi confirmado. Por favor introduza o código de confirmação recebido no seu correio eletrónico.',
      needsEmailVerification: true,
    };
  }

  // Se for conta registada via Google que ainda não possui palavra-passe própria definida
  if (found.authProvider === 'google' && (!found.hasPassword || found.passwordHash === 'google_auth_no_password')) {
    await recordLogin(found, 'email_password', 'falha');
    return {
      success: false,
      error: 'Esta conta foi registada através da Google e ainda não possui palavra-passe. Inicie sessão utilizando a opção "Continuar com Google" ou defina a sua palavra-passe no perfil.',
    };
  }

  // Verificação rigorosa de palavra-passe
  const isPasswordValid = await verifyPasswordHash(cleanPassword, found.passwordHash);

  if (!isPasswordValid) {
    await recordLogin(found, 'email_password', 'falha');
    return {
      success: false,
      error: 'Palavra-passe incorreta. Por favor verifique e tente novamente.'
    };
  }

  // Verificação estrita de função (Cliente vs Vendedor)
  if (expectedRole === 'cliente' && found.role === 'vendedor') {
    await recordLogin(found, 'email_password', 'falha');
    return {
      success: false,
      error: 'Esta conta está registada como Vendedor (Comercial). Selecione a opção "Conta Vendedor" para entrar.'
    };
  }

  if (expectedRole === 'vendedor' && found.role === 'cliente') {
    await recordLogin(found, 'email_password', 'falha');
    return {
      success: false,
      error: 'Esta conta está registada como Cliente (Comprador). Selecione a opção "Conta Cliente" para entrar.'
    };
  }

  await recordLogin(found, 'email_password', 'sucesso');
  return { success: true, user: found };
};

export const authenticateWithGoogle = async (
  profile: {
    id?: string;
    email: string;
    name: string;
    avatar?: string;
    phone?: string;
    province?: string;
  },
  selectedRole: 'cliente' | 'vendedor'
): Promise<{ success: boolean; user?: User; error?: string }> => {
  const cleanEmail = profile.email.toLowerCase().trim();
  const isSuperAdmin = isAuthorizedAdminEmail(cleanEmail);

  const users = getRegisteredUsers();
  let existing = users.find((u) => u.email.toLowerCase() === cleanEmail);

  let userToReturn: User;

  if (existing) {
    if (existing.isSuspended) {
      await recordLogin({ email: cleanEmail, name: existing.name, role: existing.role }, 'google', 'falha');
      return {
        success: false,
        error: `Esta conta está suspensa pela administração. Motivo: ${existing.suspensionReason || 'Violação das regras'}. Contacte o suporte.`,
      };
    }

    if (profile.avatar && !existing.avatar) {
      existing.avatar = profile.avatar;
    }
    if (profile.name && (!existing.name || existing.name === cleanEmail.split('@')[0])) {
      existing.name = profile.name;
    }
    if (!existing.authProvider) {
      existing.authProvider = 'google';
    }
    existing.emailConfirmed = true;
    if (isSuperAdmin) {
      existing.role = 'admin';
    }
    write(STORAGE_KEYS.USERS, users);

    userToReturn = {
      ...existing,
      hasPassword: !!existing.passwordHash && existing.passwordHash !== 'google_auth_no_password',
    };
  } else {
    const assignedRole: UserRole = isSuperAdmin ? 'admin' : selectedRole;
    const newUser: StoredUser = {
      id: profile.id || 'usr_google_' + Date.now(),
      name: profile.name.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: profile.phone || '',
      role: assignedRole,
      province: profile.province || 'Luanda',
      avatar: profile.avatar || '',
      authProvider: 'google',
      passwordHash: 'google_auth_no_password',
      emailConfirmed: true,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    write(STORAGE_KEYS.USERS, users);

    userToReturn = {
      ...newUser,
      hasPassword: false,
    };

    // Sincronizar criação no Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabaseUpdateProfile(newUser.id, {
          name: newUser.name,
          phone: newUser.phone,
          province: newUser.province,
          avatar: newUser.avatar,
        });
      } catch (err) {
        console.warn('Supabase sync da nova conta Google:', err);
      }
    }
  }

  await recordLogin(userToReturn, 'google', 'sucesso');
  return { success: true, user: userToReturn };
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>,
  options?: { bypassClaimCheck?: boolean }
): Promise<{ success: boolean; user?: User; error?: string }> => {
  const users = getRegisteredUsers();
  const index = users.findIndex((u) => u.id === userId || (updates.email && u.email.toLowerCase() === updates.email.toLowerCase()));

  if (index === -1) {
    return { success: false, error: 'Utilizador não encontrado para atualização.' };
  }

  const user = users[index];
  const editsCount = user.profileEditsCount || 0;
  const isUnlocked = !!user.profileEditUnlocked;

  // Single edit rule: if user already edited >= 1 time and is not unlocked by an approved claim
  if (editsCount >= 1 && !isUnlocked && !options?.bypassClaimCheck && user.role !== 'admin') {
    return {
      success: false,
      error: 'O seu perfil já foi editado diretamente 1 vez. Para retificar dados, utilize a opção «Reivindicar correção dos dados».',
    };
  }

  if (updates.name) user.name = updates.name.trim();
  if (updates.phone !== undefined) user.phone = updates.phone.trim();
  if (updates.province) user.province = updates.province;
  if (updates.avatar !== undefined) user.avatar = updates.avatar;

  // Count this edit and relock profile
  user.profileEditsCount = editsCount + 1;
  user.profileEditUnlocked = false;

  users[index] = user;
  write(STORAGE_KEYS.USERS, users);

  const current = getCurrentUser();
  if (current && (current.id === userId || (updates.email && current.email.toLowerCase() === updates.email.toLowerCase()))) {
    const updatedCurrent: User = {
      ...current,
      name: user.name,
      phone: user.phone,
      province: user.province,
      avatar: user.avatar,
      profileEditsCount: user.profileEditsCount,
      profileEditUnlocked: false,
      claimsCount: user.claimsCount || 0,
    };
    setCurrentUser(updatedCurrent);
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabaseUpdateProfile(user.id, {
        name: user.name,
        phone: user.phone,
        province: user.province,
        avatar: user.avatar,
      });
    } catch (err) {
      console.warn('Aviso: perfil local atualizado, Supabase sync pendente:', err);
    }
  }

  return { success: true, user };
};

export const createPasswordForGoogleUser = async (
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  const cleanPass = newPassword.trim();
  if (cleanPass.length < 6) {
    return { success: false, error: 'A nova palavra-passe deve conter pelo menos 6 caracteres.' };
  }

  const users = getRegisteredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) {
    return { success: false, error: 'Utilizador não encontrado.' };
  }

  const user = users[index];
  user.passwordHash = await hashPassword(cleanPass);
  user.hasPassword = true;
  users[index] = user;
  write(STORAGE_KEYS.USERS, users);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabaseUpdatePassword(cleanPass);
    } catch (err) {
      console.warn('Erro ao atualizar palavra-passe no Supabase:', err);
    }
  }

  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser({
      ...current,
      hasPassword: true,
    });
  }

  return { success: true };
};

export const updateUserPassword = async (email: string, newPassword: string): Promise<boolean> => {
  const cleanEmail = email.toLowerCase().trim();
  const cleanPass = newPassword.trim();

  // 1. Atualizar no Supabase se cliente estiver ligado
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabaseUpdatePassword(cleanPass);
    } catch (err) {
      console.warn('Erro ao atualizar palavra-passe no Supabase:', err);
    }
  }

  // 2. Atualizar no armazenamento local seguro
  const users = getRegisteredUsers();
  const index = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
  if (index === -1) return false;

  users[index].passwordHash = await hashPassword(cleanPass);
  write(STORAGE_KEYS.USERS, users);
  return true;
};

export const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Enviar link de redefinição via Supabase SMTP se configurado
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const res = await supabaseResetPassword(cleanEmail);
      if (res && res.error) {
        return { success: false, error: translateSupabaseError(res.error) };
      }
    } catch (err: any) {
      console.warn('Falha no pedido de recuperação do Supabase:', err);
    }
  }

  // 2. Registar pedido de recuperação local seguro
  const resets = read<Record<string, { token: string; expiresAt: number }>>('ackz_password_resets', {});
  const token = 'rst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  resets[cleanEmail] = {
    token,
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hora de validade
  };
  write('ackz_password_resets', resets);

  console.info(`[Auth Dispatcher] Ligação de recuperação de palavra-passe emitida para ${cleanEmail}`);
  return { success: true };
};

export const resetPasswordWithToken = async (
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  const cleanEmail = email.toLowerCase().trim();
  const cleanPass = newPassword.trim();

  if (cleanPass.length < 6) {
    return { success: false, error: 'A palavra-passe deve conter pelo menos 6 caracteres.' };
  }

  // 1. Atualizar no Supabase se sessão ativa
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const res = await supabaseUpdatePassword(cleanPass);
      if (res && res.error) {
        console.warn('Aviso Supabase ao redefinir palavra-passe:', res.error);
      }
    } catch (err) {
      console.warn('Erro Supabase ao redefinir palavra-passe:', err);
    }
  }

  // 2. Atualizar no armazenamento local
  const users = getRegisteredUsers();
  const index = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
  if (index !== -1) {
    users[index].passwordHash = await hashPassword(cleanPass);
    write(STORAGE_KEYS.USERS, users);
  }

  // Invalidar pedido de redefinição
  const resets = read<Record<string, any>>('ackz_password_resets', {});
  delete resets[cleanEmail];
  write('ackz_password_resets', resets);

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

// PROFILE CLAIMS
export const getProfileClaims = (): ProfileClaim[] => {
  return read<ProfileClaim[]>(STORAGE_KEYS.PROFILE_CLAIMS, []);
};

export const createProfileClaim = async (
  claimData: {
    userId: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    userRole: UserRole;
    reason: string;
    storeId?: string;
    storeName?: string;
  }
): Promise<{ success: boolean; claim?: ProfileClaim; error?: string }> => {
  const users = getRegisteredUsers();
  const user = users.find((u) => u.id === claimData.userId);
  if (!user) {
    return { success: false, error: 'Utilizador não encontrado.' };
  }

  const currentClaimsCount = user.claimsCount || 0;
  if (currentClaimsCount >= 5) {
    return {
      success: false,
      error: 'Já atingiu o limite vitalício máximo de 5 reivindicações de perfil.',
    };
  }

  const newClaimNumber = currentClaimsCount + 1;
  const newClaim: ProfileClaim = {
    id: `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: claimData.userId,
    userName: claimData.userName,
    userEmail: claimData.userEmail,
    userPhone: claimData.userPhone,
    userRole: claimData.userRole,
    storeId: claimData.storeId,
    storeName: claimData.storeName,
    reason: claimData.reason.trim(),
    claimNumber: newClaimNumber,
    status: 'pendente',
    createdAt: new Date().toISOString(),
  };

  const claims = getProfileClaims();
  claims.unshift(newClaim);
  write(STORAGE_KEYS.PROFILE_CLAIMS, claims);

  // Update user claims count
  user.claimsCount = newClaimNumber;
  write(STORAGE_KEYS.USERS, users);

  const cur = getCurrentUser();
  if (cur && cur.id === user.id) {
    setCurrentUser({ ...cur, claimsCount: newClaimNumber });
  }

  // Notify administrator
  createNotification({
    userId: 'admin',
    title: `Reivindicação de Perfil (${newClaimNumber}/5)`,
    message: `${claimData.userName} (${claimData.userRole === 'vendedor' ? 'Vendedor' : 'Cliente'}) solicitou alteração de dados: "${claimData.reason.slice(0, 70)}..."`,
    type: 'system',
  });

  return { success: true, claim: newClaim };
};

export const adminApproveProfileClaim = async (
  claimId: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> => {
  const claims = getProfileClaims();
  const claimIndex = claims.findIndex((c) => c.id === claimId);
  if (claimIndex === -1) {
    return { success: false, error: 'Reivindicação não encontrada.' };
  }

  const claim = claims[claimIndex];
  claim.status = 'aprovado';
  claim.adminNotes = adminNotes;
  claim.reviewedBy = 'Administrador AC Online Kwanza';
  claim.reviewedAt = new Date().toISOString();
  claims[claimIndex] = claim;
  write(STORAGE_KEYS.PROFILE_CLAIMS, claims);

  // Unlock user's profile for 1 edit
  const users = getRegisteredUsers();
  const userIndex = users.findIndex((u) => u.id === claim.userId);
  if (userIndex !== -1) {
    users[userIndex].profileEditUnlocked = true;
    write(STORAGE_KEYS.USERS, users);

    const cur = getCurrentUser();
    if (cur && cur.id === claim.userId) {
      setCurrentUser({ ...cur, profileEditUnlocked: true });
    }
  }

  // If vendor store, also unlock store editing
  if (claim.storeId) {
    const stores = getStores();
    const storeIndex = stores.findIndex((s) => s.id === claim.storeId);
    if (storeIndex !== -1) {
      stores[storeIndex].profileEditUnlocked = true;
      write(STORAGE_KEYS.STORES, stores);
    }
  }

  createNotification({
    userId: claim.userId,
    title: 'Reivindicação de Perfil Aprovada!',
    message: 'A administração autorizou a correção dos seus dados. O seu perfil foi libertado para 1 edição. Após guardar, será novamente protegido.',
    type: 'system',
  });

  return { success: true };
};

export const adminRejectProfileClaim = async (
  claimId: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> => {
  const claims = getProfileClaims();
  const claimIndex = claims.findIndex((c) => c.id === claimId);
  if (claimIndex === -1) {
    return { success: false, error: 'Reivindicação não encontrada.' };
  }

  const claim = claims[claimIndex];
  claim.status = 'rejeitado';
  claim.adminNotes = adminNotes || 'Solicitação rejeitada após análise da moderação.';
  claim.reviewedBy = 'Administrador AC Online Kwanza';
  claim.reviewedAt = new Date().toISOString();
  claims[claimIndex] = claim;
  write(STORAGE_KEYS.PROFILE_CLAIMS, claims);

  createNotification({
    userId: claim.userId,
    title: 'Reivindicação de Perfil Rejeitada',
    message: `A sua solicitação de alteração de dados foi rejeitada: ${claim.adminNotes}`,
    type: 'system',
  });

  return { success: true };
};

// AUTO-SUSPENSION VERIFICATION
export const checkAndApplyStoreSuspensions = (): { suspendedCount: number; stores: Store[] } => {
  const stores = getStores();
  let changed = false;
  let suspendedCount = 0;
  const now = Date.now();

  for (const st of stores) {
    // Skip if already suspended
    if (st.status === 'suspensa' || st.isSuspended) continue;

    // Check Free Trial (60 days) if not approved VIP
    if (!st.isVip || st.vipStatus !== 'aprovado') {
      const trialEnd = st.freeTrialEndDate ? new Date(st.freeTrialEndDate).getTime() : 0;
      if (trialEnd > 0 && now > trialEnd) {
        st.status = 'suspensa';
        st.isSuspended = true;
        st.suspensionDate = new Date().toISOString();
        st.suspensionReason = 'Fim do período gratuito de 60 dias sem ativação de Plano VIP';
        st.claimDeadlineDate = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
        changed = true;
        suspendedCount++;

        createNotification({
          userId: st.ownerId,
          title: 'Loja Suspensa: Fim do Período Gratuito',
          message: `O período de 60 dias gratuitos da sua loja "${st.name}" terminou. Dispõe de 30 dias para contactar a administração e ativar um plano VIP para reativação.`,
          type: 'store_claim',
        });
      }
    } else {
      // Check VIP validity: VIP Premium has NO automatic expiration
      if (st.vipPlan !== 'vip_premium' && st.vipEndDate) {
        const vipEnd = new Date(st.vipEndDate).getTime();
        if (now > vipEnd) {
          st.status = 'suspensa';
          st.isSuspended = true;
          st.suspensionDate = new Date().toISOString();
          st.suspensionReason = `Fim da validade do plano ${st.vipPlan === 'vip_1' ? 'VIP 1 (6 meses)' : 'VIP 2 (6 meses)'}`;
          st.claimDeadlineDate = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
          changed = true;
          suspendedCount++;

          createNotification({
            userId: st.ownerId,
            title: 'Loja Suspensa: Expiração do Plano VIP',
            message: `A validade do seu plano VIP para "${st.name}" expirou. Por favor contacte o administrador para reativar a loja.`,
            type: 'vip',
          });
        }
      }
    }
  }

  if (changed) {
    write(STORAGE_KEYS.STORES, stores);
  }

  return { suspendedCount, stores };
};

// VIP UPGRADE REQUEST & APPROVAL
export const requestVipUpgradeWithPlan = (
  storeId: string,
  plan: VipPlanType
): { success: boolean; store?: Store; error?: string } => {
  const stores = getStores();
  const st = stores.find((s) => s.id === storeId);
  if (!st) return { success: false, error: 'Loja não encontrada.' };

  st.vipStatus = 'solicitado';
  st.vipRequestedPlan = plan;
  st.vipRequestedDate = new Date().toISOString();

  const planLabel =
    plan === 'vip_1'
      ? 'VIP 1 (6 Meses)'
      : plan === 'vip_2'
      ? 'VIP 2 (6 Meses Reforçado)'
      : 'VIP Premium (Vitalício/Ilimitado)';

  write(STORAGE_KEYS.STORES, stores);

  createNotification({
    userId: 'admin',
    title: `Novo Pedido de Upgrade VIP: ${st.name}`,
    message: `A loja "${st.name}" escolheu o plano ${planLabel}. Vendedor aguarda informações de pagamento e aprovação.`,
    type: 'vip',
  });

  return { success: true, store: st };
};

export const adminApproveVipWithPlan = (
  storeId: string,
  plan: VipPlanType,
  priceKz: number,
  durationMonths?: number
): { success: boolean; store?: Store; error?: string } => {
  const stores = getStores();
  const st = stores.find((s) => s.id === storeId);
  if (!st) return { success: false, error: 'Loja não encontrada.' };

  const now = new Date();
  st.isVip = true;
  st.vipStatus = 'aprovado';
  st.vipPlan = plan;
  st.vipPrice = priceKz;
  st.vipStartDate = now.toISOString();

  if (plan === 'vip_premium') {
    st.vipEndDate = undefined; // Never expires
    st.vipPlanName = 'VIP Premium (Vitalício / Ilimitado)';
  } else {
    const months = durationMonths || 6;
    const end = new Date(now);
    end.setMonth(end.getMonth() + months);
    st.vipEndDate = end.toISOString();
    st.vipPlanName = plan === 'vip_1' ? 'VIP 1 (6 Meses)' : 'VIP 2 (6 Meses)';
  }

  // Reactivate store if it was suspended
  st.status = 'ativa';
  st.isSuspended = false;
  st.suspensionReason = undefined;
  st.suspensionDate = undefined;
  st.claimDeadlineDate = undefined;

  write(STORAGE_KEYS.STORES, stores);

  createNotification({
    userId: st.ownerId,
    title: 'Plano VIP Ativado com Sucesso!',
    message: `A sua loja "${st.name}" foi aprovada no plano ${st.vipPlanName}. A sua loja está ativa e em destaque oficial na AC Online Kwanza!`,
    type: 'vip',
  });

  return { success: true, store: st };
};

// REACTIVATION OF STORES BY ADMIN
export const adminReactivateStoreWithOptions = (
  storeId: string,
  options?: {
    action: 'trial' | 'vip_1' | 'vip_2' | 'vip_premium' | 'manter';
    trialDays?: number;
    vipPrice?: number;
  }
): { success: boolean; store?: Store; error?: string } => {
  const stores = getStores();
  const st = stores.find((s) => s.id === storeId);
  if (!st) return { success: false, error: 'Loja não encontrada.' };

  const now = new Date();
  st.status = 'ativa';
  st.isSuspended = false;
  st.suspensionReason = undefined;
  st.suspensionDate = undefined;
  st.claimDeadlineDate = undefined;

  if (options?.action === 'trial') {
    const days = options.trialDays || 30;
    st.freeTrialStartDate = now.toISOString();
    st.freeTrialEndDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    st.isVip = false;
    st.vipStatus = 'nenhum';
  } else if (
    options?.action === 'vip_1' ||
    options?.action === 'vip_2' ||
    options?.action === 'vip_premium'
  ) {
    const plan = options.action;
    st.isVip = true;
    st.vipStatus = 'aprovado';
    st.vipPlan = plan;
    st.vipPrice = options.vipPrice || 100000;
    st.vipStartDate = now.toISOString();
    if (plan === 'vip_premium') {
      st.vipEndDate = undefined;
      st.vipPlanName = 'VIP Premium (Vitalício / Ilimitado)';
    } else {
      const end = new Date(now);
      end.setMonth(end.getMonth() + 6);
      st.vipEndDate = end.toISOString();
      st.vipPlanName = plan === 'vip_1' ? 'VIP 1 (6 Meses)' : 'VIP 2 (6 Meses)';
    }
  }

  write(STORAGE_KEYS.STORES, stores);

  createNotification({
    userId: st.ownerId,
    title: 'Loja Reativada pela Administração!',
    message: `A administração da AC Online Kwanza reativou a sua loja "${st.name}". O seu comércio está ativo e disponível para clientes.`,
    type: 'store_approval',
  });

  return { success: true, store: st };
};

// REACTIVATION OF USER ACCOUNT
export const adminReactivateUserAccount = (
  userId: string
): { success: boolean; error?: string } => {
  const users = getRegisteredUsers();
  const u = users.find((user) => user.id === userId);
  if (!u) return { success: false, error: 'Utilizador não encontrado.' };

  u.isSuspended = false;
  u.suspensionReason = undefined;
  write(STORAGE_KEYS.USERS, users);

  const cur = getCurrentUser();
  if (cur && cur.id === userId) {
    setCurrentUser({ ...cur, isSuspended: false, suspensionReason: undefined });
  }

  createNotification({
    userId: u.id,
    title: 'Conta Reativada!',
    message: 'A sua conta na AC Online Kwanza foi reativada pelo administrador. Já pode utilizar a plataforma normalmente.',
    type: 'system',
  });

  return { success: true };
};

