'use client';

import { useState, useEffect, useRef } from 'react';

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Validate images purely on client side to avoid hydration timing issues
  useEffect(() => {
    images.forEach((img) => {
      const htmlImage = new globalThis.Image();
      htmlImage.src = `/media/${img}`;
      htmlImage.onload = () => {
        if (htmlImage.naturalWidth === 0) {
          handleImageError(img);
        }
      };
      htmlImage.onerror = () => {
        handleImageError(img);
      };
    });
  }, [images]);

  // Filter out broken images
  const validImages = images.filter((img) => !brokenImages[img]);

  // Auto-play interval
  useEffect(() => {
    if (validImages.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      handleNext();
    }, 4000);

    return () => clearInterval(timer);
  }, [currentIndex, validImages.length, isHovered]);

  // Adjust index if current image becomes invalid/broken
  useEffect(() => {
    if (validImages.length > 0 && currentIndex >= validImages.length) {
      setCurrentIndex(0);
    }
  }, [brokenImages, currentIndex, validImages.length]);

  const handleNext = () => {
    if (validImages.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const handlePrev = () => {
    if (validImages.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const handleImageError = (img: string) => {
    setBrokenImages((prev) => ({ ...prev, [img]: true }));
  };

  // Touch handlers for mobile swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const difference = touchStartX.current - touchEndX.current;
    const swipeThreshold = 50;

    if (difference > swipeThreshold) {
      handleNext();
    } else if (difference < -swipeThreshold) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // If all images are broken
  if (validImages.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-gradient-to-br from-brand-yellow/20 to-party-pink/20 flex items-center justify-center text-9xl">
        🎪
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image Slider */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-medium group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Images */}
        <div className="w-full h-full relative">
          {validImages.map((img, index) => (
            <img
              key={img}
              src={`/media/${img}`}
              alt={`${title} - Imagen ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-primary flex items-center justify-center shadow-soft md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"
              aria-label="Imagen anterior"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-primary flex items-center justify-center shadow-soft md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"
              aria-label="Siguiente imagen"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Floating Indicator Dots */}
        {validImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black/35 backdrop-blur-xs px-3 py-1.5 rounded-full">
            {validImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Ir a la imagen ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails list below */}
      {validImages.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {validImages.map((img, index) => (
            <button
              key={img}
              onClick={() => setCurrentIndex(index)}
              className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-primary shadow-soft scale-[1.02]'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <img
                src={`/media/${img}`}
                alt={`${title} miniatura ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
