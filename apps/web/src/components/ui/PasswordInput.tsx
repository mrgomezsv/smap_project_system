'use client';

import { forwardRef, useState, InputHTMLAttributes } from 'react';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Locale del botón "mostrar/ocultar" (default 'es') */
  locale?: 'es' | 'en';
}

/**
 * Input de contraseña con botón para mostrar/ocultar el texto.
 * Accesible: aria-label dinámico, focus visible en el botón.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ locale = 'es', className = '', ...props }, ref) {
    const [show, setShow] = useState(false);
    const labels = {
      es: { show: 'Mostrar contraseña', hide: 'Ocultar contraseña' },
      en: { show: 'Show password', hide: 'Hide password' },
    };
    const ariaLabel = show ? labels[locale].hide : labels[locale].show;

    return (
      <div className="relative">
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          className={`input pr-11 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={ariaLabel}
          aria-pressed={show}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-primary/30"
          tabIndex={-1}
        >
          {show ? (
            // Ojo tachado
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.7 9.7 0 0112 5c5.5 0 9.5 5 10.7 6.5a13 13 0 01-2.4 3M6.6 6.6C4.5 8 3 10.5 1.3 12c1.5 2 5.2 7 10.7 7 1.6 0 3-.3 4.3-.9"
              />
            </svg>
          ) : (
            // Ojo abierto
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    );
  },
);
