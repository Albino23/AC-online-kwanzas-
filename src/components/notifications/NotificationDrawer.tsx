import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Bell, ShoppingBag, CreditCard, MessageSquare, ShieldAlert, CheckCircle2 } from 'lucide-react';
import * as storage from '../../services/storage';

export const NotificationDrawer: React.FC = () => {
  const { notificationsDrawerOpen, setNotificationsDrawerOpen, notifications, refreshData } = useApp();

  if (!notificationsDrawerOpen) return null;

  const handleMarkAsRead = (id: string) => {
    storage.markNotificationRead(id);
    refreshData();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-amber-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'store_claim':
      case 'system':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base font-display">Notificações</h3>
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
              {notifications.filter((n) => !n.read).length} novas
            </span>
          </div>
          <button
            onClick={() => setNotificationsDrawerOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {notifications.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-600">Sem notificações</p>
              <p className="text-xs text-slate-400 mt-1">
                Todas as atualizações de encomendas, pagamentos e mensagens aparecerão aqui.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  item.read
                    ? 'bg-white border-slate-200 opacity-80'
                    : 'bg-amber-50/50 border-amber-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
