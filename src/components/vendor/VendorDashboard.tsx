import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKwanza, ANGOLAN_BANKS, ANGOLA_PROVINCES, PRODUCT_CATEGORIES, VIP_PACKAGES } from '../../data/mockData';
import { Product, Store, PaymentMethodType, VipPlanType } from '../../types';
import {
  Store as StoreIcon,
  Package,
  CreditCard,
  MessageSquare,
  Sparkles,
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Upload,
  Camera,
  Copy,
  DollarSign,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  Send,
  Building2,
  Calendar,
  X,
  Eye,
  FileText,
  ShieldAlert,
  Lock,
} from 'lucide-react';

export const VendorDashboard: React.FC = () => {
  const {
    currentUser,
    userStore,
    stores,
    products,
    orders,
    payouts,
    conversations,
    saveStoreProfile,
    saveStoreProduct,
    deleteStoreProduct,
    verifyOrderPayment,
    updateOrderStatus,
    openInvoiceModal,
    requestPayout,
    requestVipUpgrade,
    requestVipUpgradeWithPlan,
    openChatWithCustomer,
    openChatWithAdmin,
    setClaimProfileModalOpen,
    sendChatMessage,
    activeConversationMessages,
    activeConversationId,
    setChangePasswordModalOpen,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'visao-geral' | 'produtos' | 'encomendas' | 'financas' | 'dados-pagamento' | 'chat' | 'vip' | 'definicoes' | 'chat-admin'
  >('visao-geral');

  const [selectedVipPlan, setSelectedVipPlan] = useState<VipPlanType>('vip_2');
  const [adminChatInput, setAdminChatInput] = useState('');

  // Product form state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [productPrice, setProductPrice] = useState<number>(0);
  const [productOriginalPrice, setProductOriginalPrice] = useState<number | undefined>(undefined);
  const [productStock, setProductStock] = useState<number>(10);
  const [productDescription, setProductDescription] = useState('');
  const [productImages, setProductImages] = useState<string[]>([]);

  // Payout request modal
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<'iban' | 'multicaixa_express'>('iban');
  const [payoutBank, setPayoutBank] = useState(ANGOLAN_BANKS[0]);
  const [payoutHolder, setPayoutHolder] = useState(currentUser?.name || '');
  const [payoutIban, setPayoutIban] = useState('');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [payoutMcxPhone, setPayoutMcxPhone] = useState(currentUser?.phone || '');

  // Proof inspection modal
  const [inspectProofUrl, setInspectProofUrl] = useState<string | null>(null);
  const [rejectionModalOrder, setRejectionModalOrder] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Payment settings state
  const [bankName, setBankName] = useState(userStore?.paymentDetails?.bankName || ANGOLAN_BANKS[0]);
  const [accountHolder, setAccountHolder] = useState(userStore?.paymentDetails?.accountHolder || currentUser?.name || '');
  const [iban, setIban] = useState(userStore?.paymentDetails?.iban || '');
  const [accountNumber, setAccountNumber] = useState(userStore?.paymentDetails?.accountNumber || '');
  const [mcxPhone, setMcxPhone] = useState(userStore?.paymentDetails?.mcxPhone || currentUser?.phone || '');
  const [entity, setEntity] = useState(userStore?.paymentDetails?.entity || '');
  const [reference, setReference] = useState(userStore?.paymentDetails?.reference || '');

  // Store profile edit states
  const [storeName, setStoreName] = useState(userStore?.name || '');
  const [storeNif, setStoreNif] = useState(userStore?.nif || '');
  const [storeProvince, setStoreProvince] = useState(userStore?.province || 'Luanda');
  const [storeCategory, setStoreCategory] = useState(userStore?.category || PRODUCT_CATEGORIES[0]);
  const [storeAddress, setStoreAddress] = useState(userStore?.address || '');
  const [storeSupportPhone, setStoreSupportPhone] = useState(userStore?.supportPhone || currentUser?.phone || '');
  const [storeSupportEmail, setStoreSupportEmail] = useState(userStore?.supportEmail || currentUser?.email || '');
  const [storeLogoBase64, setStoreLogoBase64] = useState(userStore?.logo || '');

  if (!currentUser) return null;

  // Filter items for this vendor's store
  const vendorStoreId = userStore?.id;
  const storeProducts = products.filter((p) => p.storeId === vendorStoreId);
  const storeOrders = orders.filter((o) => o.storeId === vendorStoreId);
  const storePayouts = payouts.filter((p) => p.storeId === vendorStoreId);
  const storeConversations = conversations.filter((c) => c.storeId === vendorStoreId);

  // Financial calculations
  // Total confirmed sales value
  const confirmedOrdersTotal = storeOrders
    .filter((o) => o.status === 'pagamento_confirmado' || o.status === 'concluida' || o.status === 'a_caminho' || o.status === 'em_preparacao')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  // Total paid out
  const totalPaidOut = storePayouts.reduce((acc, p) => acc + p.amount, 0);

  // Current available balance in Kwanzas
  const availableBalance = Math.max(0, confirmedOrdersTotal - totalPaidOut);

  // 2-month trial calculation
  const trialEnd = userStore?.freeTrialEndDate ? new Date(userStore.freeTrialEndDate) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  // If no store created yet, show initial store creation form
  if (!userStore) {
    const handleInitialStoreCreate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!storeName.trim() || !storeNif.trim()) {
        showToast('Por favor preencha o nome da loja e o NIF.', 'error');
        return;
      }

      saveStoreProfile({
        name: storeName.trim(),
        nif: storeNif.trim(),
        category: storeCategory,
        province: storeProvince,
        address: storeAddress,
        supportPhone: storeSupportPhone,
        supportEmail: storeSupportEmail,
        logo: storeLogoBase64 || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
      });
    };

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center">
              <StoreIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-slate-900">
                Registar a Sua Loja Oficial em Angola
              </h2>
              <p className="text-xs text-slate-500">
                A sua conta de comerciante beneficia de 2 meses (60 dias) de vendas gratuitas na AC Online Kwanza.
              </p>
            </div>
          </div>

          <form onSubmit={handleInitialStoreCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome da Loja Comercial
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex: Luanda Mega Store Lda"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIF da Empresa ou Titular (AGT)
                </label>
                <input
                  type="text"
                  required
                  value={storeNif}
                  onChange={(e) => setStoreNif(e.target.value)}
                  placeholder="5400000000"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Província Sede
                </label>
                <select
                  value={storeProvince}
                  onChange={(e) => setStoreProvince(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {ANGOLA_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoria Principal
              </label>
              <select
                value={storeCategory}
                onChange={(e) => setStoreCategory(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp / Contacto de Atendimento
                </label>
                <input
                  type="tel"
                  value={storeSupportPhone}
                  onChange={(e) => setStoreSupportPhone(e.target.value)}
                  placeholder="+244 923 000 000"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail de Apoio ao Cliente
                </label>
                <input
                  type="email"
                  value={storeSupportEmail}
                  onChange={(e) => setStoreSupportEmail(e.target.value)}
                  placeholder="suporte@minhaloja.ao"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Aviso de Moderação:</span> Após o registo, a sua loja ficará pendente de validação pela equipa de administração. Assim que aprovada, poderá publicar produtos no mercado.
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <StoreIcon className="w-4 h-4" />
              Submeter Loja para Aprovação
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Handle image upload from phone camera / gallery
  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProductImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
      showToast('Imagem carregada da galeria/câmara.', 'success');
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (userStore.status !== 'ativa') {
      showToast('A sua loja precisa de aprovação prévia do administrador para publicar artigos.', 'error');
      return;
    }

    if (!productName.trim() || productPrice <= 0) {
      showToast('Introduza o nome e um preço válido em Kwanzas.', 'error');
      return;
    }

    saveStoreProduct({
      id: editingProduct?.id,
      name: productName.trim(),
      category: productCategory,
      price: productPrice,
      originalPrice: productOriginalPrice,
      stock: productStock,
      description: productDescription.trim(),
      images: productImages.length > 0 ? productImages : ['https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80'],
    });

    setProductModalOpen(false);
    setEditingProduct(null);
    setProductName('');
    setProductPrice(0);
    setProductOriginalPrice(undefined);
    setProductStock(10);
    setProductDescription('');
    setProductImages([]);
  };

  const handleSavePaymentDetails = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoreProfile({
      paymentDetails: {
        bankName,
        accountHolder,
        iban: iban.trim(),
        accountNumber: accountNumber.trim(),
        ibanActive: !!iban.trim(),
        entity: entity.trim(),
        reference: reference.trim(),
        referenceActive: !!reference.trim(),
        mcxPhone: mcxPhone.trim(),
        mcxActive: !!mcxPhone.trim(),
        deliveryPaymentActive: userStore.paymentDetails?.deliveryPaymentActive ?? true,
      },
    });
  };

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoreProfile({
      name: storeName.trim(),
      nif: storeNif.trim(),
      province: storeProvince,
      category: storeCategory,
      address: storeAddress.trim(),
      supportPhone: storeSupportPhone.trim(),
      supportEmail: storeSupportEmail.trim(),
      logo: storeLogoBase64 || userStore.logo,
    });
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutAmount <= 0) {
      showToast('Introduza um valor válido para levantamento.', 'error');
      return;
    }
    if (payoutAmount > availableBalance) {
      showToast(`O valor excede o saldo disponível de ${formatKwanza(availableBalance)}.`, 'error');
      return;
    }

    requestPayout(userStore.id, payoutAmount, payoutMethod, {
      bankName: payoutBank,
      accountHolder: payoutHolder,
      iban: payoutIban,
      accountNumber: payoutAccount,
      mcxPhone: payoutMcxPhone,
    });

    setPayoutModalOpen(false);
    setPayoutAmount(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header of Vendor Dashboard */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
            {userStore.logo ? (
              <img src={userStore.logo} alt="" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              userStore.name.charAt(0)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
                {userStore.name}
              </h1>
              {userStore.isVip && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                  VIP
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              NIF: <span className="font-mono text-slate-700">{userStore.nif}</span> • {userStore.province} • Portal do Comerciante
            </p>
          </div>
        </div>

        {/* 2-Month Free Trial Badge */}
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl">
          <Calendar className="w-5 h-5 text-amber-700 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-950 block">Período Gratuito de Vendas</span>
            <span className="text-amber-800">
              {daysRemaining > 0 ? `${daysRemaining} dias restantes (2 Meses Grátis)` : 'Período gratuito expirado'}
            </span>
          </div>
          {daysRemaining <= 15 && (
            <button
              onClick={() => setActiveTab('vip')}
              className="ml-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Pedir VIP
            </button>
          )}
        </div>
      </div>

      {/* CRITICAL STORE STATUS BANNER (Pendente, Reivindicada com Motivo, Ativa) */}
      {userStore.status === 'pendente' && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3 shadow-xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <h4 className="font-bold text-sm text-amber-900 mb-0.5">
              Loja Submetida para Aprovação
            </h4>
            <p>
              A sua loja encontra-se sob auditoria da administração geral da AC Online Kwanza para conferência do NIF e dados legais. A publicação e ativação de artigos será desbloqueada assim que o administrador aprovar a sua loja.
            </p>
          </div>
        </div>
      )}

      {userStore.status === 'reivindicada' && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs leading-relaxed">
            <h4 className="font-bold text-sm text-rose-900 mb-0.5">
              Aviso de Inconformidade / Reivindicação da Loja
            </h4>
            <p className="font-semibold text-rose-800 mb-1">
              Motivo emitido pelo Administrador:{' '}
              <span className="underline">{userStore.claimReason || 'Documentação ou NIF necessitam de retificação.'}</span>
            </p>
            <p className="text-rose-700">
              Por favor aceda ao separador "Definições da Loja" para corrigir as informações solicitadas. Ao guardar as alterações, a loja será novamente submetida para avaliação.
            </p>
            <button
              onClick={() => setActiveTab('definicoes')}
              className="mt-2.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs cursor-pointer"
            >
              Retificar Dados da Loja Agora
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-px mb-6 scrollbar-none">
        <button
          onClick={() => setActiveTab('visao-geral')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'visao-geral'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Visão Geral
        </button>

        <button
          onClick={() => setActiveTab('produtos')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'produtos'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Produtos & Catálogo ({storeProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('encomendas')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'encomendas'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Encomendas & Comprovativos</span>
          {storeOrders.filter((o) => o.status === 'comprovativo_enviado').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('financas')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'financas'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Finanças & Levantamentos
        </button>

        <button
          onClick={() => setActiveTab('dados-pagamento')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'dados-pagamento'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Dados de Pagamento da Loja
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'chat'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Chat com Clientes ({storeConversations.length})
        </button>

        <button
          onClick={() => setActiveTab('vip')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'vip'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Upgrade VIP
        </button>

        <button
          onClick={() => setActiveTab('definicoes')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'definicoes'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Definições da Loja
        </button>
      </div>

      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'visao-geral' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Vendas Confirmadas</span>
              <p className="text-2xl font-black text-slate-900 font-display mt-2">
                {formatKwanza(confirmedOrdersTotal)}
              </p>
              <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" /> Total Acumulado em Kwanzas
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Saldo para Levantamento</span>
              <p className="text-2xl font-black text-amber-700 font-display mt-2">
                {formatKwanza(availableBalance)}
              </p>
              <button
                onClick={() => {
                  setActiveTab('financas');
                  setPayoutModalOpen(true);
                }}
                disabled={availableBalance <= 0}
                className="mt-2 text-xs font-bold text-amber-800 hover:underline disabled:opacity-40"
              >
                Pedir Levantamento &rarr;
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Artigos no Catálogo</span>
              <p className="text-2xl font-black text-slate-900 font-display mt-2">
                {storeProducts.length}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {storeProducts.filter((p) => p.featured).length} artigos em destaque
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Encomendas Recebidas</span>
              <p className="text-2xl font-black text-slate-900 font-display mt-2">
                {storeOrders.length}
              </p>
              <span className="text-[11px] text-blue-600 mt-1 block font-medium">
                {storeOrders.filter((o) => o.status === 'comprovativo_enviado').length} comprovativos a aguardar conferência
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 bg-slate-900 text-white rounded-3xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base font-display">Próximos Passos Comerciais</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Mantenha os dados de pagamento atualizados para que os clientes realizem transferências com facilidade.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('produtos')}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Adicionar Artigo
              </button>
              <button
                onClick={() => setActiveTab('dados-pagamento')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Configurar IBAN da Loja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUTOS & CATÁLOGO */}
      {activeTab === 'produtos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg font-display text-slate-900">Catálogo de Produtos</h3>
              <p className="text-xs text-slate-500">
                Todos os artigos publicados aparecem automaticamente na área Produtos em Destaque.
              </p>
            </div>

            <button
              onClick={() => {
                if (userStore.status !== 'ativa') {
                  showToast('A sua loja precisa de estar aprovada e ativa pelo administrador para publicar novos produtos.', 'error');
                  return;
                }
                setEditingProduct(null);
                setProductName('');
                setProductPrice(0);
                setProductOriginalPrice(undefined);
                setProductStock(10);
                setProductDescription('');
                setProductImages([]);
                setProductModalOpen(true);
              }}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar Artigo
            </button>
          </div>

          {storeProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">A sua loja ainda não tem produtos cadastrados</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Carregue fotos diretamente do telemóvel, defina o preço em Kwanzas e comece a vender.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {storeProducts.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="aspect-4/3 relative bg-slate-100">
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px]">
                        Destaque
                      </span>
                    </div>
                    <div className="p-3.5">
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-2">{p.name}</h4>
                      <p className="text-sm font-black text-amber-700 font-display mt-1">
                        {formatKwanza(p.price)}
                      </p>
                      <span className="text-[11px] text-slate-500 block mt-1">
                        Estoque: <strong>{p.stock} un.</strong>
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 pt-0 flex items-center justify-between border-t border-slate-100 gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(p);
                        setProductName(p.name);
                        setProductPrice(p.price);
                        setProductOriginalPrice(p.originalPrice);
                        setProductStock(p.stock);
                        setProductCategory(p.category);
                        setProductDescription(p.description);
                        setProductImages(p.images);
                        setProductModalOpen(true);
                      }}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteStoreProduct(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Eliminar produto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ENCOMENDAS & COMPROVATIVOS */}
      {activeTab === 'encomendas' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-lg font-display text-slate-900">
              Gestão de Encomendas & Verificação de Comprovativos
            </h3>
            <p className="text-xs text-slate-500">
              Inspecione os talões de pagamento dos clientes. Ao confirmar o pagamento, o valor é creditado no seu saldo para levantamento.
            </p>
          </div>

          {storeOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
              <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Ainda não recebeu nenhuma encomenda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {storeOrders.map((ord) => (
                <div key={ord.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-sm text-slate-900">{ord.orderNumber}</span>
                      <p className="text-xs text-slate-500">
                        Cliente: <strong>{ord.customerName}</strong> ({ord.customerPhone}) • {new Date(ord.createdAt).toLocaleDateString('pt-AO')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                        {ord.status.replace('_', ' ')}
                      </span>
                      <span className="font-black text-sm text-amber-700 font-display">
                        {formatKwanza(ord.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Payment method and proof section */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Método Escolhido:</span>{' '}
                      <strong className="text-slate-900 uppercase">{ord.paymentMethod.replace('_', ' ')}</strong>
                      {ord.paymentReference && (
                        <span className="ml-3 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                          Ref: {ord.paymentReference}
                        </span>
                      )}
                    </div>

                    {ord.paymentProofUrl ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setInspectProofUrl(ord.paymentProofUrl!)}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspecionar Comprovativo
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Nenhum ficheiro anexado</span>
                    )}
                  </div>

                  {/* Actions for Vendor: Confirm or Reject Payment */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Alterar Estado:</span>
                      <select
                        value={ord.status}
                        onChange={(e) => updateOrderStatus(ord.id, e.target.value as any)}
                        className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white outline-none"
                      >
                        <option value="aguardando_pagamento">Aguardando Pagamento</option>
                        <option value="comprovativo_enviado">Comprovativo Enviado</option>
                        <option value="em_verificacao">Em Verificação</option>
                        <option value="pagamento_confirmado">Pagamento Confirmado</option>
                        <option value="em_preparacao">Em Preparação</option>
                        <option value="a_caminho">A Caminho (Transporte)</option>
                        <option value="concluida">Concluída / Entregue</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openInvoiceModal(ord)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Ver e Imprimir Fatura Comercial / Pró-forma"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        Ver Fatura
                      </button>

                      {ord.status !== 'pagamento_confirmado' && ord.status !== 'concluida' && (
                        <>
                          <button
                            onClick={() => setRejectionModalOrder(ord.id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Rejeitar Comprovativo
                          </button>

                          <button
                            onClick={() => verifyOrderPayment(ord.id, true)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Confirmar Pagamento (+ {formatKwanza(ord.totalAmount)})
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FINANÇAS & LEVANTAMENTOS */}
      {activeTab === 'financas' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-amber-950 p-6 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-amber-300 font-bold">
                Saldo Disponível de Vendas
              </span>
              <h2 className="text-3xl sm:text-4xl font-black font-display mt-1">
                {formatKwanza(availableBalance)}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Saldo acumulado de encomendas com pagamentos confirmados.
              </p>
            </div>

            <button
              onClick={() => setPayoutModalOpen(true)}
              disabled={availableBalance <= 0}
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-black rounded-xl text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              Pedir Levantamento
            </button>
          </div>

          {/* Transaction & Payout History */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-base font-display text-slate-900 mb-4">
              Histórico de Levantamentos e Transações Financeiras
            </h3>

            {storePayouts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Nenhum levantamento realizado ainda. Quando solicitar a transferência de saldo, o registo da transação aparecerá aqui.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-2.5">ID Transação</th>
                      <th className="py-2.5">Data / Hora</th>
                      <th className="py-2.5">Método & Destino</th>
                      <th className="py-2.5">Valor (Kz)</th>
                      <th className="py-2.5 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {storePayouts.map((trx) => (
                      <tr key={trx.id} className="py-3">
                        <td className="py-3 font-mono font-bold text-slate-900">{trx.id}</td>
                        <td className="py-3 text-slate-500">
                          {new Date(trx.date).toLocaleString('pt-AO')}
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-slate-800">
                            {trx.method === 'iban' ? trx.bankName : 'Multicaixa Express'}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {trx.iban || trx.mcxPhone}
                          </span>
                        </td>
                        <td className="py-3 font-black text-amber-800 font-display">
                          {formatKwanza(trx.amount)}
                        </td>
                        <td className="py-3 text-right">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Concluído
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: DADOS DE PAGAMENTO DA LOJA */}
      {activeTab === 'dados-pagamento' && (
        <div className="max-w-2xl bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-lg font-display text-slate-900">
              Configurar Métodos de Pagamento da Loja
            </h3>
            <p className="text-xs text-slate-500">
              Estes são os dados que os seus clientes verão ao finalizar compras na sua loja. Introduza dados verdadeiros.
            </p>
          </div>

          <form onSubmit={handleSavePaymentDetails} className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                A) Transferência Bancária / IBAN
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Banco Angolano
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none bg-white"
                >
                  {ANGOLAN_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Titular da Conta
                </label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Nome oficial no banco"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  IBAN (Ex: AO06 0000 0000 0000 0000 0000 0)
                </label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="AO06..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Conta
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Ex: 123456789"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none font-mono"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                B) Multicaixa Express (MCX)
              </h4>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Telemóvel MCX Express da Loja
                </label>
                <input
                  type="tel"
                  value={mcxPhone}
                  onChange={(e) => setMcxPhone(e.target.value)}
                  placeholder="923 000 000"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                C) Referência Multicaixa (Opcional)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Entidade</label>
                  <input
                    type="text"
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                    placeholder="10423"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Referência Padrão</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="908000000"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
            >
              Guardar Dados de Pagamento
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: CHAT COM CLIENTES (Conversas Individuais Separadas) */}
      {activeTab === 'chat' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-lg font-display text-slate-900">
              Conversas Individuais com Clientes
            </h3>
            <p className="text-xs text-slate-500">
              Cada cliente possui uma conversa privada e exclusiva com a sua loja. Nenhum outro comprador tem acesso a estas mensagens.
            </p>
          </div>

          {storeConversations.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Ainda não recebeu mensagens de clientes. Quando um cliente clicar no botão de chat de um artigo da sua loja, a conversa aparecerá aqui.
            </div>
          ) : (
            <div className="space-y-2">
              {storeConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => openChatWithCustomer(conv.storeId, conv.customerId)}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                      {conv.customerName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{conv.customerName}</h4>
                      <p className="text-xs text-slate-500">{conv.customerEmail}</p>
                      {conv.productName && (
                        <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">
                          Artigo: {conv.productName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">
                      {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button className="block ml-auto mt-1 px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-semibold">
                      Abrir Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: UPGRADE VIP DO VENDEDOR */}
      {activeTab === 'vip' && (
        <div className="max-w-2xl bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-display text-slate-900">
                Upgrade VIP da Loja (Após os 2 Meses Grátis)
              </h3>
              <p className="text-xs text-slate-500">
                Os primeiros 60 dias são totalmente gratuitos. Para manter o destaque prioritário, solicite o plano VIP.
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-2">
            <p>
              Estatuto Atual:{' '}
              <strong className="uppercase">
                {userStore.isVip ? 'Parceiro VIP Ativo' : userStore.vipStatus === 'solicitado' ? 'Pedido em Análise pelo Administrador' : 'Plano Gratuito (2 Meses)'}
              </strong>
            </p>
            {userStore.vipPrice && userStore.vipPrice > 0 && (
              <p>
                Valor da Taxa Definida pelo Administrador:{' '}
                <strong className="text-amber-800 font-bold">{formatKwanza(userStore.vipPrice)}</strong>
              </p>
            )}
          </div>

          {!userStore.isVip && (
            <button
              onClick={() => requestVipUpgrade(userStore.id)}
              disabled={userStore.vipStatus === 'solicitado'}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {userStore.vipStatus === 'solicitado' ? 'Pedido VIP Já Submetido à Administração' : 'Solicitar Upgrade VIP ao Administrador'}
            </button>
          )}
        </div>
      )}

      {/* TAB 8: DEFINIÇÕES DA LOJA */}
      {activeTab === 'definicoes' && (
        <div className="max-w-2xl bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-lg font-display text-slate-900">
              Definições e Perfil da Loja
            </h3>
            <p className="text-xs text-slate-500">
              Atualize os contactos de apoio ao cliente, o NIF e o logótipo da loja diretamente pelo telemóvel.
            </p>
          </div>

          <form onSubmit={handleSaveStoreSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome da Loja
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NIF (AGT)</label>
                <input
                  type="text"
                  required
                  value={storeNif}
                  onChange={(e) => setStoreNif(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Província</label>
                <select
                  value={storeProvince}
                  onChange={(e) => setStoreProvince(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl outline-none bg-white"
                >
                  {ANGOLA_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Carregar Logótipo / Imagem de Perfil (Pelo Telemóvel)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setStoreLogoBase64(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Contacto de Suporte</label>
                <input
                  type="tel"
                  value={storeSupportPhone}
                  onChange={(e) => setStoreSupportPhone(e.target.value)}
                  placeholder="+244 923 000 000"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail de Suporte da Loja</label>
                <input
                  type="email"
                  value={storeSupportEmail}
                  onChange={(e) => setStoreSupportEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
            >
              Guardar e Atualizar Perfil da Loja
            </button>
          </form>

          {/* Account Security Section */}
          <div className="pt-6 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Segurança da Conta do Vendedor
            </h4>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Palavra-passe de Acesso</p>
                <p className="text-[11px] text-slate-500">Mantenha a sua palavra-passe segura e atualizada.</p>
              </div>
              <button
                type="button"
                onClick={() => setChangePasswordModalOpen(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Alterar Palavra-passe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT CREATION/EDIT MODAL (With Camera / Mobile upload) */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base font-display">
                {editingProduct ? 'Editar Artigo' : 'Adicionar Artigo ao Catálogo'}
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Artigo
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Kit Starlink Standard V4"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço de Venda (Kz)
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={productPrice || ''}
                    onChange={(e) => setProductPrice(Number(e.target.value))}
                    placeholder="Ex: 85000"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estoque Disponível
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productStock}
                    onChange={(e) => setProductStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none bg-white"
                >
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Upload image from phone/camera */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fotografia do Artigo (Carregar da Galeria / Câmara do Telemóvel)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 py-2.5 px-3 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 rounded-xl text-center cursor-pointer transition-colors flex items-center justify-center gap-2 text-xs font-bold text-amber-900">
                    <Camera className="w-4 h-4 text-amber-700" />
                    <span>Tirar Foto ou Escolher Imagem</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleProductImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {productImages.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {productImages.map((img, i) => (
                      <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProductImages(productImages.filter((_, idx) => idx !== i))}
                          className="absolute top-0 right-0 p-0.5 bg-rose-600 text-white rounded-bl"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição Completa
                </label>
                <textarea
                  rows={3}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Detalhes técnicos, estado novo/lacrado, proveniência..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
              >
                Publicar Artigo (Destaque Automático)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PAYOUT REQUEST MODAL */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base font-display">Pedir Levantamento de Saldo</h3>
              <button onClick={() => setPayoutModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-950">
                Saldo Disponível:{' '}
                <strong className="text-sm font-bold text-amber-800">{formatKwanza(availableBalance)}</strong>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Montante a Levantar (Kz)
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  max={availableBalance}
                  value={payoutAmount || ''}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  placeholder="Ex: 50000"
                  className="w-full px-3.5 py-2.5 text-base font-bold text-slate-900 border border-slate-300 rounded-xl outline-none font-display"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Método de Recebimento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('iban')}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      payoutMethod === 'iban' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50'
                    }`}
                  >
                    Transferência IBAN
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('multicaixa_express')}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      payoutMethod === 'multicaixa_express' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50'
                    }`}
                  >
                    MCX Express
                  </button>
                </div>
              </div>

              {payoutMethod === 'iban' ? (
                <div className="space-y-2.5 pt-1 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Banco Angolano</label>
                    <select
                      value={payoutBank}
                      onChange={(e) => setPayoutBank(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none bg-white"
                    >
                      {ANGOLAN_BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">IBAN</label>
                    <input
                      type="text"
                      required
                      value={payoutIban}
                      onChange={(e) => setPayoutIban(e.target.value)}
                      placeholder="AO06..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Titular da Conta</label>
                    <input
                      type="text"
                      required
                      value={payoutHolder}
                      onChange={(e) => setPayoutHolder(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número de Telemóvel MCX Express
                  </label>
                  <input
                    type="tel"
                    required
                    value={payoutMcxPhone}
                    onChange={(e) => setPayoutMcxPhone(e.target.value)}
                    placeholder="923 000 000"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
              >
                Confirmar Levantamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PROOF INSPECTION MODAL */}
      {inspectProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-xl w-full bg-white rounded-3xl p-4 shadow-2xl">
            <button
              onClick={() => setInspectProofUrl(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="font-bold text-sm text-slate-900 mb-3">Comprovativo de Pagamento do Cliente</h4>
            <div className="max-h-[75vh] overflow-auto rounded-xl border border-slate-200">
              <img src={inspectProofUrl} alt="Comprovativo" className="w-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectionModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Motivo da Rejeição do Comprovativo</h3>
            <p className="text-xs text-slate-500">
              Indique o motivo pelo qual o comprovativo não foi validado para que o cliente possa retificar.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Valor transferido não corresponde ao total da encomenda..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectionModalOrder(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  verifyOrderPayment(rejectionModalOrder, false, rejectionReason);
                  setRejectionModalOrder(null);
                  setRejectionReason('');
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                Rejeitar Comprovativo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
