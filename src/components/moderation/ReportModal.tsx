import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, AlertTriangle, ShieldCheck } from 'lucide-react';

export const ReportModal: React.FC = () => {
  const { reportModalOpen, setReportModalOpen, reportTarget, submitReport } = useApp();

  const [reason, setReason] = useState('Produto falsificado ou de má qualidade');
  const [details, setDetails] = useState('');

  if (!reportModalOpen || !reportTarget) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport(reason, details);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-rose-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base font-display">Submeter Denúncia</h3>
          </div>
          <button
            onClick={() => setReportModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            A denunciar: <strong className="font-semibold">{reportTarget.name}</strong> ({reportTarget.type === 'store' ? 'Loja Comercial' : 'Artigo/Produto'})
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo Principal
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            >
              <option value="Produto falsificado ou cópia sem autorização">Produto falsificado ou cópia sem autorização</option>
              <option value="Preço enganoso ou fraude no pagamento">Preço enganoso ou fraude no pagamento</option>
              <option value="Vendedor não envia o produto">Vendedor não envia o produto</option>
              <option value="Informações falsas de NIF ou contacto">Informações falsas de NIF ou contacto</option>
              <option value="Artigo proibido ou perigoso">Artigo proibido ou perigoso</option>
              <option value="Outro motivo grave">Outro motivo grave</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detalhes Adicionais (opcional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explique o que aconteceu para auditoria da administração..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>A denúncia é tratada de forma confidencial pelo administrador.</span>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              Confirmar Denúncia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
