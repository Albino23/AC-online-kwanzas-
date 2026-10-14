import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKwanza } from '../../data/mockData';
import { Store, User, ReportItem } from '../../types';
import * as storage from '../../services/storage';
import {
  saveSupabaseConfig,
  getSupabaseConfig,
  testSupabaseConnection,
  SQL_SCHEMA_BLUEPRINT
} from '../../services/supabaseClient';
import {
  Shield,
  Store as StoreIcon,
  Users,
  AlertTriangle,
  Sparkles,
  Database,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Search,
  Lock,
  ArrowRight,
  TrendingUp,
  X,
  FileText
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    stores,
    orders,
    reports,
    adminApproveStore,
    adminClaimStore,
    adminSuspendStore,
    adminReactivateStore,
    adminApproveVip,
    adminSuspendUser,
    adminReactivateUser,
    adminResolveReport,
    setChangePasswordModalOpen,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'visao-geral' | 'lojas' | 'utilizadores' | 'denuncias' | 'vip' | 'supabase'>('lojas');

  // Claim modal state
  const [claimModalStoreId, setClaimModalStoreId] = useState<string | null>(null);
  const [claimReason, setClaimReason] = useState('NIF com divergência no cadastro da AGT. Por favor anexe comprovativo fiscal válido.');

  // Suspend modal state
  const [suspendUserModalId, setSuspendUserModalId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('Violação dos termos de uso da plataforma.');

  // VIP pricing state
  const [vipPriceInputs, setVipPriceInputs] = useState<Record<string, number>>({});

  // Supabase states
  const initialConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(initialConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(initialConfig.anonKey);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Security guard: strictly reserved for admin
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-rose-200 text-center shadow-lg">
        <Lock className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 font-display">Acesso Reservado</h2>
        <p className="text-xs text-slate-500 mt-2">
          Este painel é de uso estrito do Super Administrador Geral da AC Online Kwanza (albinojambav@gmail.com).
        </p>
      </div>
    );
  }

  const allUsers = storage.getRegisteredUsersSanitized();

  // Stores breakdown
  const pendingStores = stores.filter((s) => s.status === 'pendente');
  const activeStores = stores.filter((s) => s.status === 'ativa');
  const claimedStores = stores.filter((s) => s.status === 'reivindicada');
  const suspendedStores = stores.filter((s) => s.status === 'suspensa');

  // VIP requests
  const vipRequests = stores.filter((s) => s.vipStatus === 'solicitado' || !s.isVip);

  // Global sales GMV
  const gmvTotal = orders
    .filter((o) => o.status === 'pagamento_confirmado' || o.status === 'concluida')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimModalStoreId || !claimReason.trim()) return;

    adminClaimStore(claimModalStoreId, claimReason.trim());
    setClaimModalStoreId(null);
  };

  const handleSuspendUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendUserModalId) return;

    adminSuspendUser(suspendUserModalId, suspendReason.trim());
    setSuspendUserModalId(null);
  };

  const handleApproveVipSubmit = (storeId: string) => {
    const price = vipPriceInputs[storeId] || 100000;
    adminApproveVip(storeId, price);
  };

  const handleSaveAndTestSupabase = async () => {
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setTestingConnection(true);
    setTestResult(null);
    const result = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setTestingConnection(false);
    setTestResult(result);
    if (result.success) {
      showToast('Ligação ao Supabase estabelecida!', 'success');
    } else {
      showToast('Falha ao conectar ao Supabase.', 'error');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_BLUEPRINT);
    setCopiedSql(true);
    showToast('Script SQL copiado com sucesso!', 'success');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs uppercase font-bold tracking-widest text-amber-300">
              Supervisão Geral de Angola
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
            Painel do Administrador Geral
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Sessão autenticada: <strong>{currentUser?.email}</strong> • Controlo de Lojas, Clientes, Denúncias e VIP
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setChangePasswordModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Alterar Palavra-passe
          </button>

          <div className="text-right">
            <span className="text-[11px] text-amber-300 uppercase tracking-wider font-semibold block">
              Volume de Negócios (GMV)
            </span>
            <span className="text-2xl sm:text-3xl font-black font-display text-white">
              {formatKwanza(gmvTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-px mb-6 scrollbar-none">
        <button
          onClick={() => setActiveTab('lojas')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'lojas'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <StoreIcon className="w-4 h-4 text-emerald-600" />
          <span>Aprovação de Lojas</span>
          {pendingStores.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
              {pendingStores.length} Pendentes
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('utilizadores')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'utilizadores'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>Controlo de Clientes & Vendedores</span>
        </button>

        <button
          onClick={() => setActiveTab('denuncias')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'denuncias'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Denúncias ({reports.filter((r) => r.status === 'pendente').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vip')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'vip'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Upgrade VIP de Vendedores</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'supabase'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Base de Dados & Supabase</span>
        </button>
      </div>

      {/* TAB 1: MODERAÇÃO DE LOJAS (PENDENTES / ATIVAS / REIVINDICADAS) */}
      {activeTab === 'lojas' && (
        <div className="space-y-8">
          {/* Pending Stores Section */}
          <div className="bg-white rounded-3xl border border-amber-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base font-display text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Lojas Pendentes de Aprovação ({pendingStores.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Comerciantes que criaram conta e aguardam validação de NIF e conformidade pela administração.
                </p>
              </div>
            </div>

            {pendingStores.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Nenhuma loja pendente no momento. Todas as lojas foram avaliadas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingStores.map((st) => (
                  <div key={st.id} className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{st.name}</h4>
                        <p className="text-xs text-slate-500">
                          Proprietário: <strong>{st.ownerEmail}</strong>
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          NIF: <span className="font-mono font-bold text-slate-800">{st.nif}</span> • Província: {st.province}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                        Pendente
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-amber-100">
                      <button
                        onClick={() => setClaimModalStoreId(st.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Reivindicar com Motivo
                      </button>

                      <button
                        onClick={() => adminApproveStore(st.id)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aprovar e Ativar Loja
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Stores Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-base font-display text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Lojas Ativas e Autorizadas ({activeStores.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStores.map((st) => (
                <div key={st.id} className="p-4 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{st.name}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Ativa
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">NIF: <span className="font-mono">{st.nif}</span></p>
                    <p className="text-xs text-slate-500">Província: {st.province}</p>
                    <p className="text-xs text-slate-500">Vendas: {st.totalSales}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => adminSuspendStore(st.id, 'Suspensão preventiva pela administração')}
                      className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Suspender Loja
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Claimed Stores Section */}
          {claimedStores.length > 0 && (
            <div className="bg-white rounded-3xl border border-rose-200 p-6 shadow-xs">
              <h3 className="font-bold text-base font-display text-rose-950 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Lojas com Aviso de Reivindicação Emitido ({claimedStores.length})
              </h3>

              <div className="space-y-3">
                {claimedStores.map((st) => (
                  <div key={st.id} className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-rose-950">{st.name}</h4>
                      <p className="text-xs text-rose-800">
                        Motivo enviado: <strong>{st.claimReason}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => adminApproveStore(st.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Aprovar Agora
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONTROLO DE CLIENTES & VENDEDORES */}
      {activeTab === 'utilizadores' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-bold text-base font-display text-slate-900 mb-4">
            Gestão de Utilizadores Registados ({allUsers.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-2.5">Nome</th>
                  <th className="py-2.5">E-mail</th>
                  <th className="py-2.5">Tipo de Conta</th>
                  <th className="py-2.5">Província</th>
                  <th className="py-2.5">Estado</th>
                  <th className="py-2.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allUsers.map((u) => {
                  const isSuspended = u.isSuspended;
                  const isMe = u.email.toLowerCase() === currentUser?.email.toLowerCase();

                  return (
                    <tr key={u.id} className="py-3">
                      <td className="py-3 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3 text-slate-600">{u.email}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-900'
                            : u.role === 'vendedor'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{u.province || 'Luanda'}</td>
                      <td className="py-3">
                        {isSuspended ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            Suspenso
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Ativo
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {!isMe && (
                          isSuspended ? (
                            <button
                              onClick={() => adminReactivateUser(u.id)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] cursor-pointer"
                            >
                              Reativar
                            </button>
                          ) : (
                            <button
                              onClick={() => setSuspendUserModalId(u.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] cursor-pointer"
                            >
                              Suspender
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DENÚNCIAS */}
      {activeTab === 'denuncias' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base font-display text-slate-900 mb-2">
            Denúncias da Comunidade & Moderação de Fraudes
          </h3>

          {reports.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Nenhuma queixa ou denúncia registada.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        Alvo: {rep.targetName} ({rep.targetType})
                      </h4>
                      <p className="text-xs text-slate-500">
                        Denunciante: {rep.reporterName} ({rep.reporterEmail}) • {new Date(rep.createdAt).toLocaleDateString('pt-AO')}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      rep.status === 'resolvida' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {rep.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <strong>Motivo:</strong> {rep.reason}
                    {rep.details && <span className="block mt-1 text-slate-600">{rep.details}</span>}
                  </p>

                  {rep.status !== 'resolvida' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => adminResolveReport(rep.id, 'Auditado e verificado pelo administrador.')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Marcar como Resolvida
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: UPGRADE VIP DE VENDEDORES */}
      {activeTab === 'vip' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base font-display text-slate-900">
              Upgrade VIP de Lojas Comerciais
            </h3>
            <p className="text-xs text-slate-500">
              Quando o comerciante atinge o limite de 2 meses grátis ou solicita upgrade, o administrador define o montante em Kwanzas e ativa o plano.
            </p>
          </div>

          <div className="space-y-4">
            {vipRequests.map((st) => (
              <div key={st.id} className="p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{st.name}</h4>
                  <p className="text-xs text-slate-500">NIF: {st.nif} • Província: {st.province}</p>
                  <p className="text-xs text-amber-800 font-semibold mt-0.5">
                    Estado VIP: {st.isVip ? 'Ativo' : st.vipStatus === 'solicitado' ? 'Solicitado pelo Vendedor' : 'Gratuito (2 Meses)'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-36">
                    <input
                      type="number"
                      min={1000}
                      step={5000}
                      value={vipPriceInputs[st.id] ?? st.vipPrice ?? 100000}
                      onChange={(e) => setVipPriceInputs({ ...vipPriceInputs, [st.id]: Number(e.target.value) })}
                      placeholder="Valor Kz"
                      className="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl outline-none"
                    />
                  </div>

                  <button
                    onClick={() => handleApproveVipSubmit(st.id)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Ativar Estatuto VIP
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: BASE DE DADOS & SUPABASE */}
      {activeTab === 'supabase' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-base font-display text-slate-900">
              Conexão com Base de Dados Supabase (PostgreSQL)
            </h3>
            <p className="text-xs text-slate-500">
              Ligue a sua instância do Supabase para persistência remota, autenticação por e-mail e armazenamento de ficheiros.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supabase URL (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supabase Anon Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl outline-none font-mono"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveAndTestSupabase}
                disabled={testingConnection || !supabaseUrl.trim()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Database className="w-4 h-4" />
                {testingConnection ? 'A Testar Conexão...' : 'Guardar & Testar Ligação'}
              </button>

              <button
                onClick={handleCopySql}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                Copiar Script SQL Completo (RLS + Tabelas)
              </button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-2xl border text-xs ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {testResult.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLAIM STORE MODAL (Motivo da Reivindicação) */}
      {claimModalStoreId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 font-display">
              Reivindicar Loja com Motivo de Inconformidade
            </h3>
            <p className="text-xs text-slate-500">
              O vendedor receberá este motivo numa notificação direta para que possa retificar o NIF ou dados fiscais.
            </p>

            <form onSubmit={handleClaimSubmit} className="space-y-3">
              <textarea
                rows={4}
                required
                value={claimReason}
                onChange={(e) => setClaimReason(e.target.value)}
                placeholder="Explique o motivo da inconformidade..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setClaimModalStoreId(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Confirmar Reivindicação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUSPEND USER MODAL */}
      {suspendUserModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 font-display">
              Suspender Utilizador da Plataforma
            </h3>
            <textarea
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Motivo da suspensão..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSuspendUserModalId(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSuspendUserSubmit}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Confirmar Suspensão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
