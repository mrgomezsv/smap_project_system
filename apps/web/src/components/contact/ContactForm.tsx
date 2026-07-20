'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api';

interface FormData {
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  reason: string;
}

const EMPTY: FormData = {
  firstName: '',
  lastName: '',
  contactNumber: '',
  email: '',
  reason: '',
};

export function ContactForm() {
  const [data, setData] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<FormData> = {};
    if (!data.firstName.trim()) next.firstName = 'Requerido';
    if (!data.lastName.trim()) next.lastName = 'Requerido';
    if (!data.contactNumber.trim() || data.contactNumber.replace(/\D/g, '').length < 7) {
      next.contactNumber = 'Teléfono inválido';
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
      next.email = 'Email inválido';
    }
    if (!data.reason.trim() || data.reason.length < 5) {
      next.reason = 'Cuéntanos un poco más (mín. 5 caracteres)';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post('/api/web-messages', data);
      setSent(true);
      setData(EMPTY);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'No pudimos enviar tu mensaje. Intenta de nuevo.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-3">✅</div>
        <h2 className="text-2xl font-heading font-extrabold text-text-primary">¡Mensaje enviado!</h2>
        <p className="text-text-muted mt-2 max-w-md mx-auto">
          Gracias por contactarnos. Te responderemos en menos de 24 horas.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="btn btn-outline mt-6"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Nombre <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="input"
            value={data.firstName}
            onChange={(e) => update('firstName', e.target.value)}
          />
          {errors.firstName && <p className="mt-1 text-xs text-danger">{errors.firstName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Apellido <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="input"
            value={data.lastName}
            onChange={(e) => update('lastName', e.target.value)}
          />
          {errors.lastName && <p className="mt-1 text-xs text-danger">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Teléfono <span className="text-danger">*</span>
        </label>
        <input
          type="tel"
          className="input"
          placeholder="+1 (305) 555-0100"
          value={data.contactNumber}
          onChange={(e) => update('contactNumber', e.target.value)}
        />
        {errors.contactNumber && <p className="mt-1 text-xs text-danger">{errors.contactNumber}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Email <span className="text-danger">*</span>
        </label>
        <input
          type="email"
          className="input"
          placeholder="tu@email.com"
          value={data.email}
          onChange={(e) => update('email', e.target.value)}
        />
        {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          ¿En qué te podemos ayudar? <span className="text-danger">*</span>
        </label>
        <textarea
          rows={5}
          className="input resize-none"
          placeholder="Cuéntanos sobre tu evento, fecha, número de invitados, etc."
          value={data.reason}
          onChange={(e) => update('reason', e.target.value)}
        />
        {errors.reason && <p className="mt-1 text-xs text-danger">{errors.reason}</p>}
      </div>

      {errorMsg && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">
          ⚠ {errorMsg}
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3">
        {submitting ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  );
}
