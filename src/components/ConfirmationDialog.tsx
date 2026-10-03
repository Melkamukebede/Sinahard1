import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-md p-6 bg-white/95 dark:bg-[#0c182b] border border-white/80 dark:border-white/10 rounded-[28px] shadow-2xl text-zinc-900 dark:text-zinc-100 backdrop-blur-2xl"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-bold font-['Outfit',sans-serif] tracking-tight mb-2">{title}</h3>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-full border border-white/60 dark:border-white/10 bg-white/80 dark:bg-[#0f1d33] hover:bg-white dark:hover:bg-[#132238] text-zinc-700 dark:text-zinc-300 transition cursor-pointer shadow-xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 text-xs font-semibold rounded-full transition cursor-pointer shadow-xs active:scale-98 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
