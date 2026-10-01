import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastNotificationProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div id="toast-container" className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-md w-full px-4 pointer-events-none no-print">
      {toasts.map((toast) => {
        let bg = 'bg-emerald-800 text-white border-emerald-900';
        let Icon = CheckCircle2;
        if (toast.type === 'error') {
          bg = 'bg-rose-800 text-white border-rose-900';
          Icon = AlertCircle;
        } else if (toast.type === 'info') {
          bg = 'bg-blue-800 text-white border-blue-900';
          Icon = Info;
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start p-3.5 rounded-lg shadow-lg border text-sm transition-all duration-200 transform translate-y-0 ${bg}`}
          >
            <Icon className="w-5 h-5 mr-2.5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-snug">{toast.message}</div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="ml-2.5 text-white/80 hover:text-white transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
