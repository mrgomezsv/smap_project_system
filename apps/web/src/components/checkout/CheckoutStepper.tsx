'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STEPS = [
  { path: '/checkout', label: 'Datos', short: '1' },
  { path: '/checkout/waiver', label: 'Familiares', short: '2' },
  { path: '/checkout/confirm', label: 'Confirmar', short: '3' },
];

function getStepIndex(pathname: string): number {
  if (pathname.startsWith('/checkout/confirm')) return 2;
  if (pathname.startsWith('/checkout/waiver')) return 1;
  if (pathname === '/checkout' || pathname.startsWith('/checkout?')) return 0;
  return 0;
}

export function CheckoutStepper() {
  const pathname = usePathname();
  const current = getStepIndex(pathname);

  return (
    <ol className="max-w-2xl mx-auto flex items-center justify-between gap-2">
      {STEPS.map((step, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <li key={step.path} className="flex-1 flex items-center gap-2">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={[
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition',
                  isDone
                    ? 'bg-primary text-white'
                    : isActive
                      ? 'bg-brand-yellow text-primary ring-4 ring-brand-yellow/30'
                      : 'bg-gray-200 text-text-muted',
                ].join(' ')}
              >
                {isDone ? '✓' : step.short}
              </div>
              <span
                className={[
                  'text-xs sm:text-sm font-medium text-center',
                  isActive ? 'text-text-primary' : 'text-text-muted',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={[
                  'h-0.5 flex-1 -translate-y-3 transition',
                  i < current ? 'bg-primary' : 'bg-gray-200',
                ].join(' ')}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
