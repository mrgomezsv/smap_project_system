'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

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
  const [data, setData] = useState<CheckoutData>(EMPTY_DATA);

  const updateTitular = (patch: Partial<CheckoutData['titular']>) => {
    setData((prev) => ({ ...prev, titular: { ...prev.titular, ...patch } }));
  };

  const setFamiliares = (familiares: CheckoutFamiliare[]) => {
    setData((prev) => ({ ...prev, familiares }));
  };

  const reset = () => setData(EMPTY_DATA);

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
