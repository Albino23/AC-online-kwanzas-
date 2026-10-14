import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatKwanza } from '../../data/mockData';
import { Order, OrderStatus } from '../../types';
import { X, Package, FileText, Upload, CheckCircle2, Clock, AlertCircle, Truck, ExternalLink } from 'lucide-react';

export const OrdersListModal: React.FC = () => {
  const {
    ordersModalOpen,
    setOrdersModalOpen,
    orders,
    currentUser,
    uploadPaymentProof,
    openInvoiceModal,
    showToast,
  } = useApp();

  const [activeProofOrderId, setActiveProofOrderId] = useState<string | null>(null);
  const [proofFileBase64, setProofFileBase64] = useState<string>('');
  const [proofReference, setProofReference] = useState<string>('');

  if (!ordersModalOpen || !currentUser) return null;

  // Filter orders for current user
  const userOrders = orders.filter((o) => o.customerId === currentUser.id);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'aguardando_pagamento':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> Aguarda Pagamento
          </span>
        );
      case 'comprovativo_enviado':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" /> Comprovativo em Verificação
          </span>
        );
      case 'pagamento_confirmado':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Pagamento Confirmado
          </span>
        );
      case 'pagamento_rejeitado':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 text-[10px] font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Comprovativo Rejeitado
          </span>
        );
      case 'a_caminho':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-bold flex items-center gap-1">
            <Truck className="w-3 h-3 text-indigo-600" /> Em Transporte
          </span>
        );
      case 'concluida':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-slate-600" /> Entregue / Concluída
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold">
            {status}
          </span>
        );
    }
  };

  const handleUploadProofSubmit = (orderId: string) => {
    if (!proofFileBase64 && !proofReference.trim()) {
      showToast('Por favor selecione um ficheiro de imagem ou digite a referência da transação.', 'error');
      return;
    }

    uploadPaymentProof(orderId, proofFileBase64, proofReference.trim());
    setActiveProofOrderId(null);
    setProofFileBase64('');
    setProofReference('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg font-display">Histórico de Encomendas</h3>
          </div>
          <button
            onClick={() => setOrdersModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {userOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Ainda não realizou nenhuma encomenda</p>
              <p className="text-xs text-slate-500 mt-1">
                Os seus pedidos com comprovativos e recibos de pagamento serão listados aqui.
              </p>
            </div>
          ) : (
            userOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-sm text-slate-900">{ord.orderNumber}</span>
                    <p className="text-xs text-slate-500">
                      {new Date(ord.createdAt).toLocaleDateString('pt-AO')} • Loja: <strong>{ord.storeName}</strong>
                    </p>
                  </div>
                  {getStatusBadge(ord.status)}
                </div>

                {/* Items preview */}
                <div className="border-t border-slate-100 pt-2 space-y-1 text-xs text-slate-600">
                  {ord.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{it.quantity}x {it.name}</span>
                      <span className="font-semibold">{formatKwanza(it.price * it.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                    <span>Total com Envio:</span>
                    <span className="text-amber-700 font-extrabold">{formatKwanza(ord.totalAmount)}</span>
                  </div>
                </div>

                {/* Rejection message if rejected */}
                {ord.status === 'pagamento_rejeitado' && ord.paymentRejectionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                    <strong>Motivo da Rejeição:</strong> {ord.paymentRejectionReason}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openInvoiceModal(ord)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    Ver Fatura Pró-forma
                  </button>

                  {/* Upload proof button if awaiting payment or rejected */}
                  {(ord.status === 'aguardando_pagamento' || ord.status === 'pagamento_rejeitado') && (
                    <button
                      onClick={() => setActiveProofOrderId(activeProofOrderId === ord.id ? null : ord.id)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {ord.status === 'pagamento_rejeitado' ? 'Reenviar Comprovativo' : 'Anexar Comprovativo'}
                    </button>
                  )}
                </div>

                {/* In-place proof upload box */}
                {activeProofOrderId === ord.id && (
                  <div className="mt-3 p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in">
                    <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Enviar Novo Comprovativo para {ord.orderNumber}
                    </h5>

                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-200 file:text-amber-900 cursor-pointer"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={proofReference}
                        onChange={(e) => setProofReference(e.target.value)}
                        placeholder="Nº de Referência / ID da Transação no Multicaixa"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveProofOrderId(null)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleUploadProofSubmit(ord.id)}
                        className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm"
                      >
                        Submeter Comprovativo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
