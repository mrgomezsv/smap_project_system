'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthProvider';

// Cache en memoria por uid para no repetir la consulta en cada render/página
const cache = new Map<string, boolean>();

/**
 * Consulta a la API si el token pertenece a un admin. La API es la única
 * fuente de verdad (allowlist + email verificado).
 */
export async function checkIsAdmin(token: string): Promise<boolean> {
  try {
    await api.get('/api/auth/check-admin', { token });
    return true;
  } catch {
    return false;
  }
}

/** true si el usuario con sesión es admin según la API. */
export function useIsAdmin(): boolean {
  const { user, getToken } = useAuth();
  const [isAdmin, setIsAdmin] = useState(() =>
    user ? cache.get(user.uid) ?? false : false,
  );

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    const cached = cache.get(user.uid);
    if (cached !== undefined) {
      setIsAdmin(cached);
      return;
    }
    let cancelled = false;
    getToken().then(async (token) => {
      const result = token ? await checkIsAdmin(token) : false;
      cache.set(user.uid, result);
      if (!cancelled) setIsAdmin(result);
    });
    return () => {
      cancelled = true;
    };
  }, [user, getToken]);

  return isAdmin;
}
