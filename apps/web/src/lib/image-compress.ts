/**
 * Utilidad para comprimir y redimensionar imágenes en el navegador antes de subirlas al servidor.
 * Soluciona errores HTTP 413 (Payload Too Large) provocados por fotos de alta resolución (ej. 15MB-25MB de cámaras de teléfonos).
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.82,
    maxSizeBytes = 800 * 1024, // 800KB: archivos menores no se comprimen
  } = options;

  const isImage =
    file.type.startsWith('image/') ||
    file.type === 'application/octet-stream' ||
    /\.(jpg|jpeg|png|webp|heic|heif|avif|bmp)$/i.test(file.name);

  // Si no es imagen o su tamaño ya es pequeño, devolver original
  if (!isImage || file.size <= maxSizeBytes) {
    return file;
  }

  // GIF o SVGs no se deben redimensionar por canvas para no perder su animación/formato vectorial
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;

        // Calcular nueva resolución manteniendo la relación de aspecto
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // En caso de fallo de canvas, devolver archivo original
          return;
        }

        // Renderizar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a JPEG para máxima eficiencia de compresión en fotografías
        const mimeType = 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Si por alguna razón el blob resultante fuera mayor que el original, devolver original
            if (blob.size >= file.size) {
              resolve(file);
              return;
            }

            // Reemplazar la extensión por .jpg si cambió el formato
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const newFileName = `${baseName}.jpg`;

            const compressedFile = new File([blob], newFileName, {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
