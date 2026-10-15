import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKwanza } from '../../data/mockData';
import { Store, User, ReportItem, LoginHistoryItem } from '../../types';
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
  FileText,
  Clock,
  RefreshCw,
  Filter,
  Mail,
  KeyRound
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

  const [activeTab, setActiveTab] = useState<'visao-geral' | 'lojas' | 'utilizadores' | 'denuncias' | 'vip' | 'supabase' | 'historico'>('lojas');

  // Login history state
  const [loginLogs, setLoginLogs] = useState<LoginHistoryItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logMethodFilter, setLogMethodFilter] = useState<'all' | 'google' | 'email_password'>('all');
  const [logRoleFilter, setLogRoleFilter] = useState<'all' | 'cliente' | 'vendedor' | 'admin'>('all');

  const fetchLoginLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const logs = await storage.getLoginHistory();
      setLoginLogs(logs);
    } catch (err) {
      console.error('Erro ao obter histórico de acessos:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'historico') {
      fetchLoginLogs();
    }
  }, [activeTab, fetchLoginLogs]);

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

        <button
          onClick={() => setActiveTab('historico')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'historico'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-purple-600" />
          <span>Histórico de Acessos</span>
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

      {/* TAB 6: HISTÓRICO DE ACESSOS (AUDITORIA DE LOGINS GOOGLE E E-MAIL) */}
      {activeTab === 'historico' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                <span className="text-xs uppercase font-bold tracking-wider text-purple-700">
                  Registo & Auditoria de Autenticações
                </span>
              </div>
              <h3 className="font-bold text-xl font-display text-slate-900">
                Histórico de Acessos ao Sistema
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Registo detalhado de logins e métodos de autenticação (Google e E-mail) para consulta pelo administrador.
              </p>
            </div>

            <button
              onClick={fetchLoginLogs}
              disabled={loadingLogs}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              {loadingLogs ? 'A atualizar...' : 'Atualizar Histórico'}
            </button>
          </div>

          {/* Quick Metrics */}
          {(() => {
            const total = loginLogs.length;
            const googleCount = loginLogs.filter((l) => l.authMethod === 'google').length;
            const emailCount = loginLogs.filter((l) => l.authMethod === 'email_password').length;
            const successCount = loginLogs.filter((l) => l.status === 'sucesso').length;
            const failCount = loginLogs.filter((l) => l.status === 'falha').length;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Total de Logins
                  </span>
                  <span className="text-2xl font-black font-display text-slate-900 mt-1 block">
                    {total}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Auditados no sistema</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Acessos Google
                  </span>
                  <span className="text-2xl font-black font-display text-blue-900 mt-1 block">
                    {googleCount}
                  </span>
                  <span className="text-[10px] text-blue-600 mt-0.5 block">Contas Google vinculadas</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-700" />
                    E-mail & Senha
                  </span>
                  <span className="text-2xl font-black font-display text-amber-950 mt-1 block">
                    {emailCount}
                  </span>
                  <span className="text-[10px] text-amber-700 mt-0.5 block">Logins tradicionais</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Taxa de Sucesso
                  </span>
                  <span className="text-2xl font-black font-display text-emerald-950 mt-1 block">
                    {total > 0 ? Math.round((successCount / total) * 100) : 100}%
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {successCount} ok • {failCount} falhas
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Pesquisar por e-mail ou nome..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={logMethodFilter}
                onChange={(e) => setLogMethodFilter(e.target.value as any)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white text-slate-700 font-medium"
              >
                <option value="all">Todos os Métodos</option>
                <option value="google">Apenas Google</option>
                <option value="email_password">Apenas E-mail e Palavra-passe</option>
              </select>

              <select
                value={logRoleFilter}
                onChange={(e) => setLogRoleFilter(e.target.value as any)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white text-slate-700 font-medium"
              >
                <option value="all">Todas as Funções</option>
                <option value="cliente">Clientes</option>
                <option value="vendedor">Vendedores</option>
                <option value="admin">Administrador Geral</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {(() => {
            const filtered = loginLogs.filter((log) => {
              const matchesSearch =
                !logSearch.trim() ||
                log.userEmail.toLowerCase().includes(logSearch.toLowerCase().trim()) ||
                log.userName.toLowerCase().includes(logSearch.toLowerCase().trim());
              const matchesMethod = logMethodFilter === 'all' || log.authMethod === logMethodFilter;
              const matchesRole = logRoleFilter === 'all' || log.role === logRoleFilter;
              return matchesSearch && matchesMethod && matchesRole;
            });

            if (filtered.length === 0) {
              return (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Nenhum registo de acesso encontrado</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Os acessos efetuados pelos utilizadores (via Google ou E-mail) aparecerão aqui automaticamente.
                  </p>
                </div>
              );
            }

            return (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3.5">Data & Hora</th>
                        <th className="px-5 py-3.5">Utilizador</th>
                        <th className="px-5 py-3.5">Tipo de Conta</th>
                        <th className="px-5 py-3.5">Método de Acesso</th>
                        <th className="px-5 py-3.5">Resultado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((log) => {
                        const dateFormatted = new Date(log.timestamp).toLocaleString('pt-AO', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        });

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                              {dateFormatted}
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="font-bold text-slate-900">{log.userName}</p>
                              <p className="text-[11px] text-slate-500 font-mono">{log.userEmail}</p>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  log.role === 'admin'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : log.role === 'vendedor'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                                }`}
                              >
                                {log.role === 'admin'
                                  ? 'Super Admin'
                                  : log.role === 'vendedor'
                                  ? 'Vendedor'
                                  : 'Cliente'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              {log.authMethod === 'google' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-semibold border border-blue-200">
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                  </svg>
                                  Google OAuth
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                                  E-mail & Senha
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              {log.status === 'sucesso' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  Sucesso
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                                  <X className="w-3.5 h-3.5 text-rose-600" />
                                  Falha
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
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
