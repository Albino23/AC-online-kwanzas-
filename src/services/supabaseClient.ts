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
    return createClient(url, anonKey);
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
};

export const testSupabaseConnection = async (url: string, anonKey: string): Promise<{ success: boolean; message: string }> => {
  try {
    const client = createClient(url, anonKey);
    const { error } = await client.from('profiles').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "profiles" does not exist')) {
      return { success: false, message: `Erro ao conectar: ${error.message}` };
    }
    return { success: true, message: 'Conexão ao Supabase estabelecida com sucesso!' };
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
  is_suspended BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GATILHO AUTOMÁTICO PARA CRIAR PERFIL AO CRIAR CONTA NO AUTH DO SUPABASE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role user_role := 'cliente';
BEGIN
  -- albinojambav@gmail.com É AUTOMATICAMENTE SUPER ADMINISTRADOR
  IF LOWER(NEW.email) = 'albinojambav@gmail.com' THEN
    assigned_role := 'admin';
  ELSIF (NEW.raw_user_meta_data->>'role') = 'vendedor' THEN
    assigned_role := 'vendedor';
  ELSE
    assigned_role := 'cliente';
  END IF;

  INSERT INTO public.profiles (id, name, email, phone, role, province)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    assigned_role,
    COALESCE(NEW.raw_user_meta_data->>'province', 'Luanda')
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativar o gatilho na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email ON auth.users
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

-- 9. SEGURANÇA (ROW LEVEL SECURITY)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis visíveis por utilizadores autenticados" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Utilizador atualiza o próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Produtos públicos para consulta" ON public.products FOR SELECT USING (true);
CREATE POLICY "Lojas públicas para consulta" ON public.stores FOR SELECT USING (true);
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
    email,
    password,
    options: {
      data: {
        name: metadata.name,
        role: metadata.role,
        phone: metadata.phone || '',
        province: metadata.province || 'Luanda',
      },
      emailRedirectTo: `${window.location.origin}/`,
    },
  });
};

export const supabaseVerifyOtp = async (email: string, token: string) => {
  const client = getSupabaseClient();
  if (!client) return null;

  // Supabase supports 'signup' or 'email' token verification
  const res = await client.auth.verifyOtp({
    email,
    token: token.trim(),
    type: 'signup',
  });

  if (res.error) {
    // Try type 'email' fallback
    return await client.auth.verifyOtp({
      email,
      token: token.trim(),
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
    email,
  });
};

export const supabaseSignIn = async (email: string, password: string) => {
  const client = getSupabaseClient();
  if (!client) return null;

  return await client.auth.signInWithPassword({
    email,
    password,
  });
};

export const supabaseResetPassword = async (email: string) => {
  const client = getSupabaseClient();
  if (!client) return null;

  return await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/?recovery=true`,
  });
};

export const supabaseUpdatePassword = async (newPassword: string) => {
  const client = getSupabaseClient();
  if (!client) return null;

  return await client.auth.updateUser({
    password: newPassword,
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
    console.warn('Erro ao carregar perfil do Supabase:', error.message);
    return null;
  }
  return data;
};

