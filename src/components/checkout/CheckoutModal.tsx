import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKwanza, ANGOLA_PROVINCES } from '../../data/mockData';
import { PaymentMethodType } from '../../types';
import {
  X,
  CreditCard,
  Building2,
  Phone,
  Copy,
  Check,
  Upload,
  ShieldCheck,
  ArrowRight,
  FileText,
  MapPin
} from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    checkoutModalOpen,
    setCheckoutModalOpen,
    cart,
    cartTotal,
    stores,
    currentUser,
    placeOrder,
    uploadPaymentProof,
    openInvoiceModal,
    showToast,
  } = useApp();

  const [deliveryProvince, setDeliveryProvince] = useState(currentUser?.province || 'Luanda');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('iban');
  const [notes, setNotes] = useState('');

  // Payment proof states
  const [proofFileBase64, setProofFileBase64] = useState<string>('');
  const [proofReference, setProofReference] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!checkoutModalOpen || cart.length === 0) return null;

  // Retrieve primary store of first cart item for payment configuration
  const primaryStoreId = cart[0].product.storeId;
  const store = stores.find((s) => s.id === primaryStoreId);
  const paymentDetails = store?.paymentDetails;

  const deliveryFee = deliveryProvince === (store?.province || 'Luanda') ? 2500 : 5000;
  const grandTotal = cartTotal + deliveryFee;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast(`${label} copiado para a área de transferência!`, 'info');
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('O ficheiro não deve ultrapassar 10MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofFileBase64(reader.result as string);
        showToast('Comprovativo carregado com sucesso!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!deliveryAddress.trim()) {
      showToast('Por favor introduza o endereço de entrega completo.', 'error');
      return;
    }
    if (!customerPhone.trim()) {
      showToast('Por favor introduza o seu número de telemóvel para contacto.', 'error');
      return;
    }

    setLoading(true);
    const result = placeOrder({
      deliveryProvince,
      deliveryAddress: deliveryAddress.trim(),
      customerPhone: customerPhone.trim(),
      paymentMethod: selectedMethod,
      notes: notes.trim(),
    });
    setLoading(false);

    if (result.success && result.ordersCreated.length > 0) {
      const created = result.ordersCreated[0];

      // If proof attached, upload it
      if (proofFileBase64 || proofReference) {
        uploadPaymentProof(created.id, proofFileBase64, proofReference);
      }

      setCheckoutModalOpen(false);
      openInvoiceModal(created);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="font-bold text-lg font-display flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              Finalização de Encomenda & Pagamento
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Valores calculados em Kwanzas (Kz) • Dados do vendedor {store?.name || 'Oficial'}
            </p>
          </div>
          <button
            onClick={() => setCheckoutModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Delivery Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600" />
              1. Dados de Envio & Contacto
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Província de Destino
                </label>
                <select
                  value={deliveryProvince}
                  onChange={(e) => setDeliveryProvince(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {ANGOLA_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telemóvel do Destinatário
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="923 000 000"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço Completo de Entrega (Rua, Bairro, Município)
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Ex: Rua Direita do Futungo, Casa 45, Luanda"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method Selection */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              2. Método de Pagamento do Vendedor
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSelectedMethod('iban')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMethod === 'iban'
                    ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="block text-xs font-bold text-slate-900">Transferência IBAN</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Bancos Angolanos</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('multicaixa_express')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMethod === 'multicaixa_express'
                    ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="block text-xs font-bold text-slate-900">Multicaixa Express</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Número Móvel MCX</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('referencia')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMethod === 'referencia'
                    ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="block text-xs font-bold text-slate-900">Referência MCX</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Pagamento ATM</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('entrega')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMethod === 'entrega'
                    ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="block text-xs font-bold text-slate-900">Na Entrega</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">TPA / Dinheiro</span>
              </button>
            </div>

            {/* Dynamic Payment Details Display with One-Click Copy */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-3">
              {selectedMethod === 'iban' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Banco:</span>
                    <strong className="text-slate-900">{paymentDetails?.bankName || 'Banco Angolano de Investimentos (BAI)'}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Titular da Conta:</span>
                    <strong className="text-slate-900">{paymentDetails?.accountHolder || store?.name || 'Vendedor Oficial'}</strong>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                    <div>
                      <span className="block text-[10px] text-slate-400">IBAN de Pagamento:</span>
                      <strong className="font-mono text-xs text-slate-900">{paymentDetails?.iban || 'AO06004000001234567890123'}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentDetails?.iban || 'AO06004000001234567890123', 'IBAN')}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'IBAN' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              {selectedMethod === 'multicaixa_express' && (
                <div className="space-y-2">
                  <p className="text-slate-600 leading-relaxed">
                    Envie o valor correspondente via aplicativo Multicaixa Express (MCX) para o contacto do lojista:
                  </p>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="block text-[10px] text-slate-400">Contacto MCX Express:</span>
                      <strong className="font-mono text-sm text-slate-900">{paymentDetails?.mcxPhone || store?.supportPhone || '923 111 222'}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentDetails?.mcxPhone || '923111222', 'Número MCX')}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'Número MCX' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      Copiar Número
                    </button>
                  </div>
                </div>
              )}

              {selectedMethod === 'referencia' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="block text-[10px] text-slate-400">Entidade:</span>
                      <strong className="font-mono text-xs">{paymentDetails?.entity || '10423'}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="block text-[10px] text-slate-400">Referência:</span>
                      <strong className="font-mono text-xs">{paymentDetails?.reference || '908123456'}</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Efetue o pagamento em qualquer caixa Multicaixa ATM ou Internet Banking no menu Pagamentos &gt; Serviços.
                  </p>
                </div>
              )}

              {selectedMethod === 'entrega' && (
                <p className="text-slate-600 leading-relaxed">
                  Pague diretamente ao estafeta no momento da entrega utilizando TPA Multicaixa móvel ou dinheiro em mão.
                </p>
              )}
            </div>
          </div>

          {/* Section 3: Payment Proof (Comprovativo) Form */}
          {selectedMethod !== 'entrega' && (
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-600" />
                3. Anexar Comprovativo de Transferência (Opcional ou Imediato)
              </h4>
              <p className="text-[11px] text-slate-500 mb-3">
                Pode anexar a foto do talão do ATM, captura de ecrã do telemóvel ou inserir o número da operação bancária para validação imediata pelo comerciante.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Carregar Fotografia / Captura do Comprovativo
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
                  />
                  {proofFileBase64 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Ficheiro de comprovativo pronto para envio</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número de Referência / ID da Transação Bancária
                  </label>
                  <input
                    type="text"
                    value={proofReference}
                    onChange={(e) => setProofReference(e.target.value)}
                    placeholder="Ex: TRF-20250912-9841 ou Ref. Operação"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal dos Artigos:</span>
              <span>{formatKwanza(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Taxa de Entrega ({deliveryProvince}):</span>
              <span>{formatKwanza(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-amber-200 font-display">
              <span>Total a Liquidar:</span>
              <span className="text-amber-700 text-base">{formatKwanza(grandTotal)}</span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'A processar encomenda...' : 'Confirmar Encomenda & Gerar Fatura'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
