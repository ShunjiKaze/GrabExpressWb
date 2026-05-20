import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircleIcon, XCircleIcon, InfoIcon, AlertTriangleIcon } from './Icons';

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const icons = {
    success: <CheckCircleIcon size={18} />,
    error:   <XCircleIcon size={18} />,
    info:    <InfoIcon size={18} />,
    warning: <AlertTriangleIcon size={18} />,
  };

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{icons[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
