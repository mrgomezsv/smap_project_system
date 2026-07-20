import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { PublicHeader } from '@/components/public/Header';
import { PublicFooter } from '@/components/public/Footer';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <PublicHeader />
          <main className="flex-1">{children}</main>
          <PublicFooter />
        </div>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
