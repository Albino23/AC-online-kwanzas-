import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatKwanza } from '../../data/mockData';
import { getRegisteredUsersSanitized } from '../../services/storage';
import {
  X,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  Building2,
  MapPin,
  Mail,
  Phone,
  Receipt,
  FileText,
  Calendar,
  Hash,
  CreditCard,
  User as UserIcon,
  ShieldCheck,
  Package
} from 'lucide-react';
import { OrderStatus, PaymentMethodType } from '../../types';

export const InvoiceModal: React.FC = () => {
  const { invoiceModalOpen, closeInvoiceModal, selectedOrderForInvoice, stores, products } = useApp();

  if (!invoiceModalOpen || !selectedOrderForInvoice) return null;

  const order = selectedOrderForInvoice;

  // Retrieve store and seller information
  const store = stores.find((s) => s.id === order.storeId);
  const allUsers = getRegisteredUsersSanitized();
  const seller = store ? allUsers.find((u) => u.id === store.ownerId || (store.ownerEmail && u.email.toLowerCase() === store.ownerEmail.toLowerCase())) : null;

  const sellerName = seller?.name || (store?.ownerEmail ? store.ownerEmail.split('@')[0] : 'Vendedor Credenciado');
  const storeNif = store?.nif || 'Não especificado';
  const storePhone = store?.supportPhone || seller?.phone || 'Não especificado';
  const storeEmail = store?.supportEmail || store?.ownerEmail || seller?.email || 'Não especificado';
  const storeAddress = store ? `${store.address}, ${store.province}` : 'República de Angola';

  // Format order date & time
  const orderDateObj = new Date(order.createdAt);
  const formattedDate = orderDateObj.toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = orderDateObj.toLocaleTimeString('pt-AO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Unique Invoice identifier
  const invoiceNumber = `FT AO-${orderDateObj.getFullYear()}/${order.orderNumber.replace(/[^a-zA-Z0-9]/g, '')}`;

  const formatPaymentMethod = (method: PaymentMethodType) => {
    switch (method) {
      case 'iban':
        return 'Transferência Bancária / IBAN';
      case 'multicaixa_express':
        return 'Multicaixa Express (MCX)';
      case 'referencia':
        return 'Pagamento por Referência Multicaixa';
      case 'entrega':
        return 'Pagamento no Ato da Entrega';
      default:
        return String(method).toUpperCase();
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'aguardando_pagamento':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Aguardando Pagamento
          </span>
        );
      case 'comprovativo_enviado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Comprovativo em Verificação
          </span>
        );
      case 'em_verificacao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-indigo-600" /> Em Verificação
          </span>
        );
      case 'pagamento_confirmado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pagamento Confirmado
          </span>
        );
      case 'pagamento_rejeitado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Pagamento Rejeitado
          </span>
        );
      case 'em_preparacao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-semibold">
            <Package className="w-3.5 h-3.5 text-purple-600" /> Em Preparação
          </span>
        );
      case 'a_caminho':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold">
            <Truck className="w-3.5 h-3.5 text-sky-600" /> Em Transporte
          </span>
        );
      case 'concluida':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-extrabold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Concluída / Entregue
          </span>
        );
      case 'cancelada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold">
            <X className="w-3.5 h-3.5 text-slate-600" /> Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:fixed-none">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[96vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:rounded-none">
        
        {/* Top actions bar - Hidden in Print */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              AC
            </div>
            <div>
              <h3 className="font-bold text-sm font-display text-white">Fatura Comercial / Pró-forma</h3>
              <p className="text-[11px] text-slate-400 font-mono">{invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Fatura
            </button>
            <button
              onClick={closeInvoiceModal}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="relative p-6 sm:p-10 overflow-y-auto flex-1 font-sans text-slate-800 space-y-7 bg-white print:p-6 print:overflow-visible">
          
          {/* Subtle Watermark on background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-[0.03] print:opacity-[0.04]">
            <div className="text-center transform -rotate-12">
              <span className="text-[180px] font-black tracking-tighter text-slate-900 font-display block leading-none">
                AC
              </span>
              <span className="text-2xl font-black uppercase tracking-[0.3em] text-slate-900 block mt-2">
                ONLINE KWANZA
              </span>
            </div>
          </div>

          {/* 1. Header (Cabeçalho estritamente conforme solicitado:
              - Logótipo AC em forma de marca de água
              - Nome AC ONLINE KWANZA
              - Marketplace Nacional de Angola
              - Luanda, República de Angola
              - REMOVIDO COMPLETAMENTE O CONTACTO DO SUPORTE ADMINISTRATIVO) */}
          <div className="relative flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                {/* Logótipo AC com visual estilizado em marca de água / insígnia limpa */}
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white font-black flex items-center justify-center text-lg shadow-sm border border-amber-400/30 overflow-hidden">
                  <span className="relative z-10 tracking-tighter">AC</span>
                  <div className="absolute inset-0 bg-white/10 opacity-30 transform -rotate-12 scale-150" />
                </div>
                <div>
                  <h1 className="font-extrabold text-2xl tracking-tight text-slate-900 font-display leading-tight">
                    AC ONLINE <span className="text-amber-600">KWANZA</span>
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Marketplace Nacional de Angola
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 pt-1">Luanda, República de Angola</p>
            </div>

            {/* Invoice meta info */}
            <div className="sm:text-right space-y-1.5 w-full sm:w-auto pt-2 sm:pt-0">
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-extrabold text-[11px] rounded-lg uppercase tracking-wider">
                Fatura Comercial / Pró-forma
              </span>
              <div className="space-y-0.5">
                <p className="text-xs text-slate-500 flex sm:justify-end items-center gap-1.5 font-mono">
                  <Hash className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-bold text-slate-900 text-sm">{invoiceNumber}</span>
                </p>
                <p className="text-xs text-slate-500 flex sm:justify-end items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pedido: <strong className="text-slate-800 font-mono">{order.orderNumber}</strong></span>
                </p>
                <p className="text-xs text-slate-500 flex sm:justify-end items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formattedDate} às {formattedTime}</span>
                </p>
              </div>
              <div className="pt-1 flex sm:justify-end">
                {getStatusBadge(order.status)}
              </div>
            </div>
          </div>

          {/* 2 & 3. Grid: Dados do Vendedor/Loja & Dados do Comprador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            {/* 2. Dados Completos do Vendedor e da Loja */}
            <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Dados do Vendedor e da Loja
                </h4>
              </div>
              
              <div className="space-y-1.5 pt-0.5">
                <div>
                  <span className="text-[11px] text-slate-400 block">Nome da Loja:</span>
                  <span className="font-bold text-slate-900 text-sm">{store?.name || order.storeName}</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">Responsável / Vendedor:</span>
                  <span className="font-semibold text-slate-800">{sellerName}</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">NIF da Empresa / Titular:</span>
                  <span className="font-mono font-medium text-slate-800">{storeNif}</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">Contacto Telefónico / WhatsApp:</span>
                  <span className="text-slate-700 flex items-center gap-1 font-medium">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {storePhone}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">E-mail Comercial:</span>
                  <span className="text-slate-700 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {storeEmail}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">Localização / Endereço:</span>
                  <span className="text-slate-700 flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    {storeAddress}
                  </span>
                </div>

                {store?.category && (
                  <div>
                    <span className="text-[11px] text-slate-400 block">Categoria Comercial:</span>
                    <span className="text-slate-700">{store.category}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Dados Completos do Comprador */}
            <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <UserIcon className="w-4 h-4 text-amber-600 shrink-0" />
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Dados do Comprador
                </h4>
              </div>

              <div className="space-y-1.5 pt-0.5">
                <div>
                  <span className="text-[11px] text-slate-400 block">Nome Completo:</span>
                  <span className="font-bold text-slate-900 text-sm">{order.customerName}</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">E-mail de Contacto:</span>
                  <span className="text-slate-700 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {order.customerEmail}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">Telefone / WhatsApp:</span>
                  <span className="text-slate-700 flex items-center gap-1 font-medium">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {order.customerPhone}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">Endereço de Entrega:</span>
                  <span className="text-slate-700 flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    {order.deliveryAddress}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">Província de Destino:</span>
                  <span className="font-semibold text-slate-800">{order.deliveryProvince}</span>
                </div>

                {order.notes && order.notes.trim() !== '' && (
                  <div>
                    <span className="text-[11px] text-slate-400 block">Observações do Comprador:</span>
                    <span className="text-slate-600 italic">{order.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Todos os detalhes da compra: Artigos */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-amber-600" />
              Discriminação de Artigos e Serviços
            </h4>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-3 px-4">Artigo / Descrição</th>
                    <th className="py-3 px-3 text-center">Qtd</th>
                    <th className="py-3 px-4 text-right">Preço Unitário</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => {
                    const matchedProduct = products.find((p) => p.id === item.productId);
                    const itemDescription = matchedProduct?.description;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          {itemDescription && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {itemDescription}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: {item.productId.slice(0, 8)}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700 font-medium">
                          {formatKwanza(item.price)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatKwanza(item.price * item.quantity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment & Totals Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Payment Details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                Detalhes de Liquidação
              </div>
              <p className="text-slate-700">
                <strong className="text-slate-900">Método de Pagamento:</strong>{' '}
                {formatPaymentMethod(order.paymentMethod)}
              </p>
              {order.paymentReference && (
                <p className="text-slate-700 font-mono text-[11px]">
                  <strong className="text-slate-900">Referência do Comprovativo:</strong>{' '}
                  {order.paymentReference}
                </p>
              )}
              {store?.paymentDetails?.ibanActive && store?.paymentDetails?.iban && (
                <div className="pt-1.5 text-[11px] text-slate-600 border-t border-slate-200/80">
                  <span className="font-semibold text-slate-800">Coordenadas da Loja:</span>
                  <p className="font-mono text-slate-800 font-bold mt-0.5">{store.paymentDetails.iban}</p>
                  <p className="text-[10px] text-slate-500">
                    {store.paymentDetails.bankName} • {store.paymentDetails.accountHolder}
                  </p>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                <span>Subtotal dos Artigos:</span>
                <span className="font-medium text-slate-800">
                  {formatKwanza(order.totalAmount - order.deliveryFee)}
                </span>
              </div>
              
              <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                <span>Taxa de Envio ({order.deliveryProvince}):</span>
                <span className="font-medium text-slate-800">{formatKwanza(order.deliveryFee)}</span>
              </div>

              <div className="flex justify-between py-2 text-base font-black text-slate-900 border-t-2 border-slate-900 pt-2 font-display">
                <span>Total a Liquidar:</span>
                <span className="text-amber-700 text-lg font-mono">
                  {formatKwanza(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Legal / AGT Angola Statement */}
          <div className="pt-6 border-t border-slate-200 text-[10px] text-slate-400 text-center leading-relaxed space-y-1">
            <p className="font-medium text-slate-500">
              Documento emitido para efeitos de confirmação comercial e liquidação no marketplace AC Online Kwanza.
            </p>
            <p>
              Processado por programa informático certificado pela Administração Geral Tributária (AGT) da República de Angola.
            </p>
            <p className="font-mono text-[9px] text-slate-400">
              Hash de Controlo Fiscal: {order.id.slice(0, 16).toUpperCase()} • Luanda, Angola
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
