'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

const LABELS: Record<string, string> = {
  es: '🇪🇸 ES',
  en: '🇺🇸 EN',
};

export function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = e.target.value;
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      disabled={pending}
      className="text-xs font-medium text-primary/80 bg-white/20 hover:bg-white/30 rounded-md px-2 py-1 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
      aria-label="Cambiar idioma"
    >
      <option value="es">{LABELS.es}</option>
      <option value="en">{LABELS.en}</option>
    </select>
  );
}
