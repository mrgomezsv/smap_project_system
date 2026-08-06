'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export interface CheckoutFamiliare {
  name: string;
  age: number;
}

export interface CheckoutData {
  titular: {
    name: string;
    email: string;
    phone: string;
  };
  familiares: CheckoutFamiliare[];
}

const EMPTY_DATA: CheckoutData = {
  titular: { name: '', email: '', phone: '' },
  familiares: [],
};

interface CheckoutContextValue {
  data: CheckoutData;
  setData: (data: CheckoutData) => void;
  updateTitular: (patch: Partial<CheckoutData['titular']>) => void;
  setFamiliares: (familiares: CheckoutFamiliare[]) => void;
  reset: () => void;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<CheckoutData>(EMPTY_DATA);
  const [isHydrated, setIsHydrated] = useState(false);

  // Cargar localStorage únicamente en el cliente (evita hydration error)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kf_checkout_data');
      if (saved) {
        setData(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error cargando checkout state de localStorage', e);
    }
    setIsHydrated(true);
  }, []);

  // Cargar automáticamente Nombre, Email y Teléfono anterior del usuario de Firebase/DB
  useEffect(() => {
    if (user) {
      setData((prev) => ({
        ...prev,
        titular: {
          ...prev.titular,
          name: prev.titular.name || user.displayName || '',
          email: prev.titular.email || user.email || '',
        },
      }));

      user.getIdToken().then((token) => {
        import('@/lib/api').then(({ api }) => {
          api.get<{ waivers: Array<{ userPhone?: string }> }>('/api/v2/waiver/user/me', { token })
            .then((res) => {
              const latestPhone = res.waivers?.find((w) => w.userPhone && w.userPhone.trim() !== '')?.userPhone;
              if (latestPhone) {
                setData((prev) => ({
                  ...prev,
                  titular: {
                    ...prev.titular,
                    phone: latestPhone,
                  },
                }));
              }
            })
            .catch(() => {});
        });
      });
    }
  }, [user]);

  // Guardar cambios en localStorage automáticamente (solo tras hidratación inicial)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      try {
        localStorage.setItem('kf_checkout_data', JSON.stringify(data));
      } catch (e) {
        console.error('Error guardando checkout state en localStorage', e);
      }
    }
  }, [data, isHydrated]);

  const updateTitular = (patch: Partial<CheckoutData['titular']>) => {
    setData((prev) => ({ ...prev, titular: { ...prev.titular, ...patch } }));
  };

  const setFamiliares = (familiares: CheckoutFamiliare[]) => {
    setData((prev) => ({ ...prev, familiares }));
  };

  const reset = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kf_checkout_data');
    }
    setData(EMPTY_DATA);
  };

  return (
    <CheckoutContext.Provider value={{ data, setData, updateTitular, setFamiliares, reset }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx) {
    throw new Error('useCheckout debe usarse dentro de CheckoutProvider');
  }
  return ctx;
}
