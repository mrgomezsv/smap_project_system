import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['es', 'en'] as const;
export const defaultLocale = 'es' as const;
export type Locale = (typeof locales)[number];

/**
 * Detecta el locale desde:
 * 1. Cookie NEXT_LOCALE (preferida, seteada por el switcher)
 * 2. Header Accept-Language
 * 3. Default 'es'
 */
export function detectLocale(): Locale {
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as Locale;
  }

  const acceptLang = headers().get('accept-language') ?? '';
  const preferred = acceptLang.split(',')[0]?.split('-')[0];
  if (preferred && (locales as readonly string[]).includes(preferred)) {
    return preferred as Locale;
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = detectLocale();
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
