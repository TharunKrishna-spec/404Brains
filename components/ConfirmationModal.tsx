import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowingButton from './GlowingButton';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  confirmButtonClassName?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
  confirmButtonClassName,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-black border-2 border-red-500 rounded-lg p-6 space-y-4 shadow-2xl shadow-red-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-orbitron text-red-400">{title}</h3>
            <div className="text-gray-300 font-rajdhani">{message}</div>
            <div className="flex space-x-4 justify-end pt-4">
              <button
                onClick={onClose}
                disabled={isConfirming}
                className="px-6 py-2 bg-gray-600 rounded-md font-bold hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <GlowingButton
                onClick={onConfirm}
                className={confirmButtonClassName || '!py-2 !px-6 !border-red-500 group-hover:!bg-red-500'}
                loading={isConfirming}
              >
                {confirmText}
              </GlowingButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;