import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastType) => {
    const id = uuidv4();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000); // Auto-dismiss after 5 seconds
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };
  
  const success = (message: string) => addToast(message, 'success');
  const error = (message: string) => addToast(message, 'error');
  const info = (message: string) => addToast(message, 'info');

  return (
    <ToastContext.Provider value={{ addToast, success, error, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] w-full max-w-sm">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const toastVariants = {
  success: {
    bgColor: 'bg-green-600/80 backdrop-blur-sm',
    borderColor: 'border-green-400',
    icon: '✅',
  },
  error: {
    bgColor: 'bg-red-600/80 backdrop-blur-sm',
    borderColor: 'border-red-400',
    icon: '❌',
  },
  info: {
    bgColor: 'bg-blue-600/80 backdrop-blur-sm',
    borderColor: 'border-blue-400',
    icon: 'ℹ️',
  },
};

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
    const variant = toastVariants[toast.type];

    return (
        <motion.div
        layout
        initial={{ opacity: 0, y: 50, scale: 0.3 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
        className={`relative w-full p-4 mb-4 rounded-lg shadow-lg border-2 ${variant.bgColor} ${variant.borderColor}`}
        >
        <div className="flex items-center">
            <div className="text-xl mr-3">{variant.icon}</div>
            <p className="text-white font-rajdhani font-semibold">{toast.message}</p>
        </div>
        <button
            onClick={() => onDismiss(toast.id)}
            className="absolute top-2 right-2 text-white/70 hover:text-white"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        </motion.div>
    );
};
