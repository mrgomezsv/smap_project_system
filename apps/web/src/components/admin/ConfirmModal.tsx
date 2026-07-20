'use client';

import { useEffect, useState } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  requireText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  requireText,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (open) setText('');
  }, [open]);

  if (!open) return null;

  const canConfirm = !requireText || text === requireText;
  const btnClass = variant === 'danger' ? 'btn bg-danger text-white hover:bg-danger/90' : 'btn btn-primary';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-large max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-heading font-bold text-text-primary mb-2">{title}</h3>
        {description && <p className="text-sm text-text-muted mb-4">{description}</p>}

        {requireText && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Escribe <code className="font-mono text-danger">{requireText}</code> para confirmar
            </label>
            <input
              type="text"
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="btn btn-ghost">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={!canConfirm} className={btnClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
