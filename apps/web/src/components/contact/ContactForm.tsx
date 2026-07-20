'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('contact');
  const tCommon = useTranslations('common');
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
    if (!data.firstName.trim()) next.firstName = tCommon('error');
    if (!data.lastName.trim()) next.lastName = tCommon('error');
    if (!data.contactNumber.trim() || data.contactNumber.replace(/\D/g, '').length < 7) {
      next.contactNumber = tCommon('error');
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
      next.email = tCommon('error');
    }
    if (!data.reason.trim() || data.reason.length < 5) {
      next.reason = tCommon('error');
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
      setErrorMsg(e instanceof ApiError ? e.message : tCommon('error'));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-3">✅</div>
        <h2 className="text-2xl font-heading font-extrabold text-text-primary">
          {t('success')}
        </h2>
        <p className="text-text-muted mt-2 max-w-md mx-auto">
          {t('successSubtitle')}
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="btn btn-outline mt-6"
        >
          {tCommon('back')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            {t('name')} <span className="text-danger">*</span>
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
            {t('lastName')} <span className="text-danger">*</span>
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
          {t('phone')} <span className="text-danger">*</span>
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
          {t('email')} <span className="text-danger">*</span>
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
          {t('message')} <span className="text-danger">*</span>
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
        {submitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
