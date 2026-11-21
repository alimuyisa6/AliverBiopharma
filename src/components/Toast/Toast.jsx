 /* components/Toast/Toast.jsx */
import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon/Icon';

const ToastContext = createContext(null);

const TOAST_ICONS = {
  success: 'circle',
  error: 'circle-xmark',
  warning: 'exclamation-triangle',
  info: 'circle-info'
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;

    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}

      {createPortal(
        <div className="fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
          {toasts.map((toast) => (
            <div key={toast.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium leading-6 shadow-lg backdrop-blur transition hover:-translate-y-0.5 ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : toast.type === 'error' ? 'border-red-200 bg-red-50 text-red-900' : toast.type === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-sky-200 bg-sky-50 text-sky-900'}`} onClick={() => removeToast(toast.id)}>
              <Icon name={TOAST_ICONS[toast.type] || 'circle-info'} />
              <span>{toast.message}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);

  if (!ctx) throw new Error('useToast must be used within ToastProvider');

  return ctx;
}
