import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, CheckCircle2, Trash2, X, HelpCircle } from 'lucide-react';

export interface DialogOptions {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface CustomDialogProps {
  options: DialogOptions | null;
  onClose: () => void;
}

export const CustomDialog: React.FC<CustomDialogProps> = ({ options, onClose }) => {
  if (!options || !options.isOpen) return null;

  const {
    title,
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
    variant = 'danger',
    onConfirm,
    onCancel
  } = options;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 border-2 border-red-200 shadow-inner">
            <Trash2 className="w-6 h-6" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border-2 border-amber-200 shadow-inner">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case 'success':
        return (
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border-2 border-emerald-200 shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border-2 border-blue-200 shadow-inner">
            <Info className="w-6 h-6" />
          </div>
        );
    }
  };

  const isConfirmDialog = Boolean(onCancel || cancelText);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden z-10"
        >
          {/* Top Decorative Header Accent */}
          <div className={`h-2 ${
            variant === 'danger'
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-800'
              : variant === 'warning'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-600'
              : variant === 'success'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
              : 'bg-gradient-to-r from-blue-600 to-indigo-700'
          }`} />

          {/* Close Button */}
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Content */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              {getIcon()}
              <div className="flex-1 pt-0.5">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {title || (variant === 'danger' ? 'Xác nhận xóa' : 'Thông báo')}
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                  {message}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              {isConfirmDialog && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2 font-bold text-xs rounded-xl text-white shadow-sm transition-all cursor-pointer ${
                  variant === 'danger'
                    ? 'bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 shadow-red-200'
                    : variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : variant === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-800 hover:bg-red-900 text-white'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
