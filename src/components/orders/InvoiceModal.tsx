import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatKwanza } from '../../data/mockData';
import { X, Printer, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';

export const InvoiceModal: React.FC = () => {
  const { invoiceModalOpen, closeInvoiceModal, selectedOrderForInvoice } = useApp();

  if (!invoiceModalOpen || !selectedOrderForInvoice) return null;

  const order = selectedOrderForInvoice;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[95vh] flex flex-col">
        {/* Top actions bar */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm font-display">Fatura Pró-forma / Recibo de Venda</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Fatura
            </button>
            <button
              onClick={closeInvoiceModal}
              className="text-slate-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-8 overflow-y-auto flex-1 font-sans text-slate-800 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white font-extrabold flex items-center justify-center text-sm">
                  AC
                </div>
                <h2 className="font-extrabold text-xl tracking-tight text-slate-900 font-display">
                  AC ONLINE <span className="text-amber-600">KWANZA</span>
                </h2>
              </div>
              <p className="text-xs text-slate-500">Marketplace Nacional de Angola</p>
              <p className="text-xs text-slate-500">Luanda, República de Angola</p>
              <p className="text-xs text-slate-500">Suporte Admin: +244 936 304 817</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-extrabold text-xs rounded-full uppercase tracking-wider mb-2">
                Fatura Pró-forma
              </span>
              <p className="text-sm font-bold text-slate-900 font-mono">{order.orderNumber}</p>
              <p className="text-xs text-slate-500">
                Data: {new Date(order.createdAt).toLocaleDateString('pt-AO')}
              </p>
              <p className="text-xs font-semibold text-emerald-700 uppercase mt-1">
                Estado: {order.status.replace('_', ' ')}
              </p>
            </div>
          </div>

          {/* Client & Store Details */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px]">
                Dados do Comprador:
              </h4>
              <p className="font-semibold text-slate-800">{order.customerName}</p>
              <p className="text-slate-600">{order.customerEmail}</p>
              <p className="text-slate-600">Contacto: {order.customerPhone}</p>
              <p className="text-slate-600 mt-1">
                Destino: {order.deliveryAddress}, {order.deliveryProvince}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px]">
                Dados do Comerciante / Loja:
              </h4>
              <p className="font-semibold text-slate-800">{order.storeName}</p>
              <p className="text-slate-600">Venda autorizada na AC Online Kwanza</p>
              <p className="text-slate-600">
                Método de Pagamento: {order.paymentMethod.replace('_', ' ').toUpperCase()}
              </p>
              {order.paymentReference && (
                <p className="text-slate-600 font-mono mt-1">
                  Ref. Comprovativo: {order.paymentReference}
                </p>
              )}
            </div>
          </div>

          {/* Line items table */}
          <div>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2">Artigo</th>
                  <th className="py-2 text-center">Qtd</th>
                  <th className="py-2 text-right">Preço Unit.</th>
                  <th className="py-2 text-right">Total (Kz)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="py-2">
                    <td className="py-2.5 font-medium text-slate-900">{item.name}</td>
                    <td className="py-2.5 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-2.5 text-right text-slate-600">{formatKwanza(item.price)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      {formatKwanza(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary totals */}
          <div className="border-t-2 border-slate-300 pt-4 flex justify-end text-xs">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal dos Artigos:</span>
                <span>{formatKwanza(order.totalAmount - order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxa de Envio ({order.deliveryProvince}):</span>
                <span>{formatKwanza(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2 font-display">
                <span>Total a Liquidar:</span>
                <span className="text-amber-700">{formatKwanza(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Legal / AGT note */}
          <div className="pt-6 border-t border-slate-200 text-[10px] text-slate-400 text-center leading-relaxed">
            <p>Este documento constitui uma Fatura Pró-forma para liquidação via transferência bancária, Multicaixa Express ou no ato da entrega.</p>
            <p>Processado por programa informático certificado pela Administração Geral Tributária (AGT) de Angola.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
