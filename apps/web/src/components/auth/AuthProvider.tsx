'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provider que escucha cambios en Firebase Auth y expone:
 * - user: usuario actual (o null)
 * - ready: true después del primer check
 * - getToken: devuelve un token fresco (con auto-refresh si está a punto de expirar)
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setReady(true);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return unsub;
  }, []);

  /**
   * Devuelve un token válido. Si el token está a menos de 60s de expirar,
   * pide uno nuevo (force refresh).
   */
  async function getToken(): Promise<string | null> {
    if (!user) return null;
    try {
      // getIdToken() acepta forceRefresh. Sin argumento, usa cache si está vivo.
      // Para auto-refresh, chequeamos expiración vía claims del JWT.
      const result = await user.getIdTokenResult(false);
      const expiresAt = new Date(result.expirationTime).getTime();
      const now = Date.now();
      const secondsLeft = (expiresAt - now) / 1000;
      if (secondsLeft < 60) {
        // Refrescar si está a <60s de expirar
        return user.getIdToken(true);
      }
      return result.token;
    } catch {
      return user.getIdToken();
    }
  }

  return (
    <AuthContext.Provider value={{ user, ready, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
