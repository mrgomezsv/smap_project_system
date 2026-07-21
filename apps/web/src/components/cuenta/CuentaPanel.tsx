'use client';

import { CuentaForm } from '@/components/auth/CuentaForm';
import { MisWaivers } from '@/components/cuenta/MisWaivers';
import { useAuth } from '@/components/auth/AuthProvider';

export function CuentaPanel() {
  const { user, ready } = useAuth();
  const showMisWaivers = ready && Boolean(user);

  return (
    <div className="space-y-6">
      <div className="max-w-md mx-auto">
        <CuentaForm />
      </div>
      {showMisWaivers && <MisWaivers />}
    </div>
  );
}
