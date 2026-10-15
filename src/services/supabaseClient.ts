import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = 'ackz_supabase_url';
const SUPABASE_ANON_KEY = 'ackz_supabase_anon_key';

export const getSupabaseConfig = () => {
  return {
    url: localStorage.getItem(SUPABASE_URL_KEY) || import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: localStorage.getItem(SUPABASE_ANON_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
};

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
};

export const translateSupabaseError = (err: any): string => {
  if (!err) return 'Ocorreu um erro inesperado.';
  const message = typeof err === 'string' ? err : err.message || '';
  const msgLower = message.toLowerCase();

  if (msgLower.includes('invalid login credentials') || msgLower.includes('invalid credentials')) {
    return 'E-mail ou palavra-passe incorretos. Por favor verifique e tente novamente.';
  }
  if (msgLower.includes('email not confirmed')) {
    return 'O seu e-mail ainda não foi confirmado. Por favor introduza o código de confirmação recebido na sua caixa de correio.';
  }
  if (msgLower.includes('user already registered') || msgLower.includes('already exists')) {
    return 'Já existe uma conta registada com este endereço de e-mail.';
  }
  if (msgLower.includes('password should be at least')) {
    return 'A palavra-passe deve conter pelo menos 6 caracteres.';
  }
  if (msgLower.includes('rate limit') || msgLower.includes('too many requests')) {
    return 'Limite de pedidos atingido. Aguarde alguns minutos antes de tentar novamente.';
  }
  if (msgLower.includes('token has expired') || msgLower.includes('invalid token') || msgLower.includes('otp expired')) {
    return 'O código de confirmação expirou ou é inválido. Por favor solicite um novo código.';
  }
  if (msgLower.includes('signup is disabled')) {
    return 'O registo de novos utilizadores está temporariamente indisponível no servidor.';
  }
  if (msgLower.includes('error sending confirmation email') || msgLower.includes('error sending')) {
    return 'Erro no envio do e-mail via servidor SMTP. Verifique a configuração SMTP no Supabase.';
  }
  if (msgLower.includes('unsupported provider') || msgLower.includes('provider is not enabled') || msgLower.includes('oauth')) {
    return 'O provedor Google ainda não foi ativado no painel do Supabase (Authentication > Providers > Google).';
  }

  return message;
};

export const testSupabaseConnection = async (url: string, anonKey: string): Promise<{ success: boolean; message: string }> => {
  try {
    const client = createClient(url, anonKey);
    const { error } = await client.from('profiles').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "profiles" does not exist')) {
      return { success: false, message: `Erro ao conectar: ${translateSupabaseError(error)}` };
    }
    return { success: true, message: 'Conexão ao Supabase estabelecida com sucesso! Tabelas acessíveis.' };
  } catch (err: any) {
    return { success: false, message: `Falha na requisição: ${err.message || err}` };
  }
};

export const SQL_SCHEMA_BLUEPRINT = `-- ==========================================
-- AC ONLINE KWANZA - ESQUEMA SUPABASE POSTGRESQL
-- Executar no SQL Editor do Supabase
-- ==========================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('cliente', 'vendedor', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE store_status AS ENUM ('pendente', 'ativa', 'reivindicada', 'suspensa');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'aguardando_pagamento',
    'comprovativo_enviado',
    'em_verificacao',
    'pagamento_confirmado',
    'pagamento_rejeitado',
    'em_preparacao',
    'a_caminho',
    'concluida',
    'cancelada'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA DE PERFIS (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role user_role DEFAULT 'cliente' NOT NULL,
  province TEXT DEFAULT 'Luanda',
  avatar TEXT,
  auth_provider TEXT DEFAULT 'email',
  is_suspended BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GATILHO AUTOMÁTICO PARA CRIAR PERFIL AO CRIAR CONTA NO AUTH DO SUPABASE (EMAIL OU GOOGLE)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role user_role := 'cliente';
  user_name TEXT;
  user_avatar TEXT;
  user_provider TEXT;
BEGIN
  -- albinojambav@gmail.com É AUTOMATICAMENTE SUPER ADMINISTRADOR OFICIAL
  IF LOWER(NEW.email) = 'albinojambav@gmail.com' THEN
    assigned_role := 'admin';
  ELSIF (NEW.raw_user_meta_data->>'role') = 'vendedor' THEN
    assigned_role := 'vendedor';
  ELSE
    assigned_role := 'cliente';
  END IF;

  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    ''
  );

  user_provider := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    'email'
  );

  INSERT INTO public.profiles (id, name, email, phone, role, province, avatar, auth_provider)
  VALUES (
    NEW.id,
    user_name,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    assigned_role,
    COALESCE(NEW.raw_user_meta_data->>'province', 'Luanda'),
    user_avatar,
    user_provider
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE 
      WHEN LOWER(EXCLUDED.email) = 'albinojambav@gmail.com' THEN 'admin'::user_role
      ELSE EXCLUDED.role 
    END,
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    province = COALESCE(EXCLUDED.province, profiles.province),
    avatar = CASE WHEN EXCLUDED.avatar <> '' THEN EXCLUDED.avatar ELSE profiles.avatar END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativar o gatilho na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. TABELA DE LOJAS
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  name TEXT NOT NULL,
  nif TEXT NOT NULL,
  category TEXT NOT NULL,
  province TEXT NOT NULL,
  address TEXT,
  logo TEXT,
  banner TEXT,
  rating NUMERIC(2,1) DEFAULT 5.0,
  total_sales INT DEFAULT 0,
  free_trial_start TIMESTAMPTZ DEFAULT NOW(),
  free_trial_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '60 days'),
  is_vip BOOLEAN DEFAULT FALSE,
  vip_status TEXT DEFAULT 'nenhum',
  vip_price NUMERIC(12,2) DEFAULT 0,
  status store_status DEFAULT 'pendente',
  claim_reason TEXT,
  is_suspended BOOLEAN DEFAULT FALSE,
  support_phone TEXT,
  support_email TEXT,
  payment_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL,
  original_price NUMERIC(12,2),
  stock INT DEFAULT 0 NOT NULL,
  category TEXT NOT NULL,
  province TEXT NOT NULL,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  featured BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE ENCOMENDAS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  store_name TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  delivery_fee NUMERIC(12,2) DEFAULT 0,
  delivery_province TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_proof_url TEXT,
  payment_reference TEXT,
  payment_rejection_reason TEXT,
  status order_status DEFAULT 'aguardando_pagamento',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABELA DE LEVANTAMENTOS (PAYOUTS)
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  store_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  method TEXT NOT NULL,
  bank_name TEXT,
  account_holder TEXT,
  iban TEXT,
  account_number TEXT,
  mcx_phone TEXT,
  status TEXT DEFAULT 'concluido',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SEGURANÇA E POLÍTICAS RLS COMPLETAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Políticas Profiles
DROP POLICY IF EXISTS "Perfis públicos para consulta" ON public.profiles;
CREATE POLICY "Perfis públicos para consulta" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Utilizador insere o próprio perfil" ON public.profiles;
CREATE POLICY "Utilizador insere o próprio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Utilizador atualiza o próprio perfil" ON public.profiles;
CREATE POLICY "Utilizador atualiza o próprio perfil" ON public.profiles FOR UPDATE USING (
  auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR email = 'albinojambav@gmail.com')
  )
);

-- Políticas Stores
DROP POLICY IF EXISTS "Lojas públicas para consulta" ON public.stores;
CREATE POLICY "Lojas públicas para consulta" ON public.stores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Vendedores criam loja" ON public.stores;
CREATE POLICY "Vendedores criam loja" ON public.stores FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Proprietário ou Admin atualiza loja" ON public.stores;
CREATE POLICY "Proprietário ou Admin atualiza loja" ON public.stores FOR UPDATE USING (
  auth.uid() = owner_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR email = 'albinojambav@gmail.com')
  )
);

-- Políticas Products
DROP POLICY IF EXISTS "Produtos públicos para consulta" ON public.products;
CREATE POLICY "Produtos públicos para consulta" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Vendedor insere produtos da sua loja" ON public.products;
CREATE POLICY "Vendedor insere produtos da sua loja" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR email = 'albinojambav@gmail.com'))
);

DROP POLICY IF EXISTS "Vendedor atualiza produtos da sua loja" ON public.products;
CREATE POLICY "Vendedor atualiza produtos da sua loja" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR email = 'albinojambav@gmail.com'))
);

DROP POLICY IF EXISTS "Vendedor elimina produtos da sua loja" ON public.products;
CREATE POLICY "Vendedor elimina produtos da sua loja" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR email = 'albinojambav@gmail.com'))
);

-- Políticas Orders
DROP POLICY IF EXISTS "Consultar encomendas relevantes" ON public.orders;
CREATE POLICY "Consultar encomendas relevantes" ON public.orders FOR SELECT USING (
  auth.uid() = customer_id OR
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR email = 'albinojambav@gmail.com'))
);

DROP POLICY IF EXISTS "Clientes e utilizadores criam encomendas" ON public.orders;
CREATE POLICY "Clientes e utilizadores criam encomendas" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Atualizar encomendas autorizadas" ON public.orders;
CREATE POLICY "Atualizar encomendas autorizadas" ON public.orders FOR UPDATE USING (
  auth.uid() = customer_id OR
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR email = 'albinojambav@gmail.com'))
);

-- Políticas Payouts
DROP POLICY IF EXISTS "Consultar levantamentos" ON public.payouts;
CREATE POLICY "Consultar levantamentos" ON public.payouts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR email = 'albinojambav@gmail.com'))
);

DROP POLICY IF EXISTS "Criar pedidos de levantamento" ON public.payouts;
CREATE POLICY "Criar pedidos de levantamento" ON public.payouts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR email = 'albinojambav@gmail.com'))
);

-- 10. TABELA DE HISTÓRICO DE ACESSOS (AUDIT LOG DE LOGINS)
CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  role user_role NOT NULL,
  auth_method TEXT NOT NULL, -- 'email_password' ou 'google'
  status TEXT DEFAULT 'sucesso',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins consultam histórico de acessos" ON public.login_history;
CREATE POLICY "Admins consultam histórico de acessos" ON public.login_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR email = 'albinojambav@gmail.com'))
);

DROP POLICY IF EXISTS "Inserção permitida para registo de login" ON public.login_history;
CREATE POLICY "Inserção permitida para registo de login" ON public.login_history FOR INSERT WITH CHECK (true);
`;

// ==========================================
// OPERAÇÕES AUTH DO SUPABASE REAL
// ==========================================

export const supabaseSignUp = async (
  email: string,
  password: string,
  metadata: { name: string; role: 'cliente' | 'vendedor'; phone?: string; province?: string }
) => {
  const client = getSupabaseClient();
  if (!client) return null;

  return await client.auth.signUp({
    email: email.trim().toLowerCase(),
    password: password.trim(),
    options: {
      data: {
        name: metadata.name.trim(),
        role: metadata.role,
        phone: metadata.phone?.trim() || '',
        province: metadata.province || 'Luanda',
      },
      emailRedirectTo: `${window.location.origin}/`,
    },
  });
};

export const supabaseVerifyOtp = async (email: string, token: string) => {
  const client = getSupabaseClient();
  if (!client) return null;

  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();

  // 1. Tentar tipo 'signup'
  const res = await client.auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: 'signup',
  });

  if (res.error) {
    // 2. Tentar tipo 'email' como alternativa compatível com modelos SMTP do Supabase
    return await client.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'email',
    });
  }

  return res;
};

export const supabaseResendOtp = async (email: string) => {
  const client = getSupabaseClient();
  if (!client) return null;

  return await client.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${window.location.origin}/`,
    },
  });
};

export const supabaseSignIn = async (email: string, password: string) => {
  const client = getSupabaseClient();
  if (!client) return null;

  return await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: password.trim(),
  });
};

export const supabaseResetPassword = async (email: string) => {
  const client = getSupabaseClient();
  if (!client) return null;

  return await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/?recovery=true`,
  });
};

export const supabaseUpdatePassword = async (newPassword: string) => {
  const client = getSupabaseClient();
  if (!client) return null;

  return await client.auth.updateUser({
    password: newPassword.trim(),
  });
};

export const supabaseSignOut = async () => {
  const client = getSupabaseClient();
  if (!client) return null;

  return await client.auth.signOut();
};

export const supabaseGetProfile = async (userId: string) => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('Perfil ainda não criado na tabela profiles:', error.message);
    return null;
  }
  return data;
};

export const supabaseGetCurrentSession = async () => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data } = await client.auth.getSession();
  return data.session;
};

export const supabaseOnAuthStateChange = (
  callback: (event: string, session: any) => void
) => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: { subscription } } = client.auth.onAuthStateChange(callback);
  return subscription;
};

export const supabaseSignInWithGoogle = async (role: 'cliente' | 'vendedor') => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error('Supabase não configurado') };

  try {
    localStorage.setItem('ackz_google_pending_role', role);

    const res = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    return res;
  } catch (err: any) {
    return { data: null, error: err };
  }
};

export const supabaseUpdateProfile = async (
  userId: string,
  updates: { name?: string; phone?: string; province?: string; avatar?: string }
) => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.warn('Erro ao atualizar perfil no Supabase:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Falha na chamada supabaseUpdateProfile:', err);
    return null;
  }
};

export const supabaseRecordLogin = async (entry: {
  userId?: string;
  userEmail: string;
  userName: string;
  role: string;
  authMethod: string;
  status?: string;
}) => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('login_history').insert({
      user_id: entry.userId || null,
      user_email: entry.userEmail.toLowerCase().trim(),
      user_name: entry.userName.trim(),
      role: entry.role,
      auth_method: entry.authMethod,
      status: entry.status || 'sucesso',
    });

    if (error) {
      console.warn('Não foi possível gravar histórico de login no Supabase:', error.message);
    }
    return data;
  } catch (err) {
    console.warn('Falha ao registar login no Supabase:', err);
    return null;
  }
};

export const supabaseGetLoginHistory = async () => {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('login_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('Erro ao ler login_history no Supabase:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Falha ao obter histórico de login:', err);
    return [];
  }
};
