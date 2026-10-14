import React from 'react';
import { ADMIN_PHONE, ADMIN_SUPPORT_EMAIL } from '../../data/mockData';
import { ShieldCheck, Phone, Mail, MapPin, Heart, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-900 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-extrabold text-base">
                AC
              </div>
              <span className="font-extrabold text-base text-white tracking-tight font-display">
                AC ONLINE <span className="text-amber-500">KWANZA</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              A maior rede de comércio eletrónico de Angola. Compras e vendas 100% em Kwanzas (Kz), protegidas por comprovativos bancários, Multicaixa Express e moderação de lojas pela AGT.
            </p>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Sede: Luanda, República de Angola</span>
            </div>
          </div>

          {/* Official Support by Administrator Albino Jamba */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-display">
              Apoio ao Cliente & Vendedor
            </h4>
            <p className="text-slate-400 text-xs">
              Suporte oficial direto com a administração geral para ativação de lojas, esclarecimento de pagamentos e denúncias:
            </p>
            <div className="space-y-2 pt-1">
              <a
                href={`https://wa.me/244936304817`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-slate-200 hover:text-emerald-400 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold">{ADMIN_PHONE} (WhatsApp & Chamadas)</span>
              </a>
              <a
                href={`mailto:${ADMIN_SUPPORT_EMAIL}`}
                className="flex items-center gap-2 text-slate-200 hover:text-amber-400 transition-colors"
              >
                <Mail className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">{ADMIN_SUPPORT_EMAIL}</span>
              </a>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-display">
              Métodos de Pagamento Angolanos
            </h4>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Multicaixa Express (MCX) Direto
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Referência Multicaixa (ATM / Homebanking)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Transferência Bancária (BAI, BFA, Atlântico, BIC)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Pagamento Presencial / TPA na Entrega
              </li>
            </ul>
          </div>

          {/* Vendedores & 2 Meses Grátis */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-display">
              Portal do Comerciante
            </h4>
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                2 Meses de Vendas Grátis
              </span>
              <p className="text-slate-300 text-xs">
                Abra a sua loja sem comissões nos primeiros 60 dias. Depois, faça upgrade VIP com valor definido pelo administrador.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} AC Online Kwanza. Todos os direitos reservados. República de Angola.</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Sistema auditado e em conformidade com as diretrizes da AGT</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
