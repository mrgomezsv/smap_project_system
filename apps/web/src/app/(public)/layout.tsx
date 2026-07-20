import { AuthProvider } from '@/components/auth/AuthProvider';
import { PublicHeader } from '@/components/public/Header';
import { PublicFooter } from '@/components/public/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </div>
    </AuthProvider>
  );
}
