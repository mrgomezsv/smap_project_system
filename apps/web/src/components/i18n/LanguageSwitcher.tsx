'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  function changeLocale(newLocale: string) {
    if (newLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex bg-white/20 rounded-md border border-primary/20 p-0.5 shadow-sm" style={{ opacity: pending ? 0.5 : 1, pointerEvents: pending ? 'none' : 'auto' }}>
      <button
        type="button"
        onClick={() => changeLocale('es')}
        className={`text-xs font-bold px-2 py-1 rounded transition-colors ${
          locale === 'es' ? 'bg-white text-primary shadow-sm' : 'text-primary/70 hover:bg-white/30 hover:text-primary'
        }`}
      >
        🇪🇸 ES
      </button>
      <button
        type="button"
        onClick={() => changeLocale('en')}
        className={`text-xs font-bold px-2 py-1 rounded transition-colors ${
          locale === 'en' ? 'bg-white text-primary shadow-sm' : 'text-primary/70 hover:bg-white/30 hover:text-primary'
        }`}
      >
        🇺🇸 EN
      </button>
    </div>
  );
}
