import React from 'react';

export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded shadow-xl w-[95%] max-w-2xl max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="font-semibold">{title}</div>
          <button onClick={onClose} className="text-sm opacity-70 hover:opacity-100">✕</button>
        </div>
        <div className="p-4">
          {children}
        </div>
        {footer && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
