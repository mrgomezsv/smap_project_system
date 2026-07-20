import { CheckoutProvider } from '@/components/checkout/CheckoutProvider';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <CheckoutProvider>
      <div className="bg-surface min-h-screen">
        <div className="container py-10">
          <CheckoutStepper />
          <div className="mt-10 max-w-3xl mx-auto">{children}</div>
        </div>
      </div>
    </CheckoutProvider>
  );
}
