import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Product } from '@/lib/types';
import { type Category } from '@/lib/types';
import { SafeImage } from '@/components/ui/SafeImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const tCategories = useTranslations('categories');
  const tProduct = useTranslations('product');
  const hasRealImage = product.img && !product.img.includes('default_product_image');

  return (
    <Link
      href={`/productos/${product.id}`}
      className="group card hover:shadow-large hover:-translate-y-1 transition-all overflow-hidden p-0"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
        {hasRealImage ? (
          <SafeImage
            src={`/media/${product.img}`}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            fallback="🎪"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl opacity-40">
            🎪
          </div>
        )}
        <span className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-soft z-10">
          {tCategories(product.category as Category)}
        </span>
        {product.publicated && (
          <span className="absolute top-3 right-3 bg-success/95 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-soft z-10">
            {tProduct('available')}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-heading font-bold text-text-primary line-clamp-1 group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        {product.description && (
          <p className="mt-2 text-sm text-text-muted line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-3 flex items-center gap-4 text-xs text-text-muted pt-3 border-t border-border">
          <span className="flex items-center gap-1">
            <span className="text-party-pink">♥</span> {product._count?.likes ?? 0}
          </span>
          <span className="flex items-center gap-1">
            💬 {product._count?.comments ?? 0}
          </span>
          {product.dimensions && (
            <span className="ml-auto text-text-muted">{product.dimensions}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
