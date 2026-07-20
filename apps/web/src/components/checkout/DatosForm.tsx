'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCheckout } from './CheckoutProvider';

export function DatosForm() {
  const router = useRouter();
  const { data, updateTitular } = useCheckout();
  const t = useTranslations('checkout');
  const tErr = useTranslations('checkout.errors');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    if (!data.titular.name.trim()) next.name = tErr('required');
    if (!data.titular.email.trim()) {
      next.email = tErr('required');
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.titular.email)) {
      next.email = tErr('invalidEmail');
    }
    if (data.titular.phone && data.titular.phone.replace(/\D/g, '').length < 7) {
      next.phone = tErr('invalidPhone');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      router.push('/checkout/waiver');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <header>
        <h1 className="text-2xl font-heading font-extrabold text-text-primary">
          {t('yourData')}
        </h1>
        <p className="text-sm text-text-muted mt-1">{t('yourDataSubtitle')}</p>
      </header>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          {t('name')} <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="input"
          placeholder="María Pérez"
          value={data.titular.name}
          onChange={(e) => updateTitular({ name: e.target.value })}
          autoComplete="name"
        />
        {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          {t('email')} <span className="text-danger">*</span>
        </label>
        <input
          type="email"
          className="input"
          placeholder="tu@email.com"
          value={data.titular.email}
          onChange={(e) => updateTitular({ email: e.target.value })}
          autoComplete="email"
        />
        {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          {t('phone')}
        </label>
        <input
          type="tel"
          className="input"
          placeholder="+1 (305) 555-0100"
          value={data.titular.phone}
          onChange={(e) => updateTitular({ phone: e.target.value })}
          autoComplete="tel"
        />
        {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone}</p>}
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn btn-primary px-8 py-3">
          {t('continue')}
        </button>
      </div>
    </form>
  );
}
