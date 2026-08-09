import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private readonly memoryCache = new Map<string, string>();
  private readonly memoryCacheMax = 5000; // LRU aproximado por tamaño

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Traduce un texto usando la API pública de Google Translate con caché de 2 niveles:
   * - L1: memoria (rápido, hot path)
   * - L2: BD (persiste entre reinicios, compartido entre instancias)
   * Si falla por red, retorna el texto original de forma segura.
   */
  async translate(text: string, targetLang: 'es' | 'en'): Promise<string> {
    if (!text || text.trim() === '') return text;

    const cacheKey = `${targetLang}:${text}`;

    // L1: memoria
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!;
    }

    // L2: BD
    try {
      const sourceHash = this.hash(text);
      const cached = await this.prisma.translationCache.findUnique({
        where: { sourceHash },
      });
      if (cached && cached.targetLang === targetLang) {
        this.setMemory(cacheKey, cached.translatedText);
        return cached.translatedText;
      }
    } catch (e) {
      this.logger.warn(
        `TranslationCache BD lookup falló: ${(e as Error).message}`,
      );
    }

    // L3: API externa
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedText = data[0]
          .map((chunk: any) =>
            Array.isArray(chunk) && chunk[0] ? chunk[0] : '',
          )
          .join('');

        if (translatedText) {
          this.setMemory(cacheKey, translatedText);
          // Persistir en BD de forma async (no bloquea response)
          this.persistToDb(text, targetLang, translatedText).catch((e) =>
            this.logger.warn(`TranslationCache BD persist falló: ${e.message}`),
          );
          return translatedText;
        }
      }
      return text;
    } catch (error) {
      this.logger.warn(
        `No se pudo traducir "${text.slice(0, 30)}...": ${error}`,
      );
      return text;
    }
  }

  /**
   * Traduce title y description de un producto si lang es 'es' o 'en'.
   */
  async translateProduct<
    T extends { title: string; description?: string | null },
  >(product: T, targetLang?: string): Promise<T> {
    if (!targetLang || (targetLang !== 'es' && targetLang !== 'en')) {
      return product;
    }

    const [translatedTitle, translatedDesc] = await Promise.all([
      this.translate(product.title, targetLang),
      product.description
        ? this.translate(product.description, targetLang)
        : Promise.resolve(product.description),
    ]);

    return {
      ...product,
      title: translatedTitle,
      description: translatedDesc,
    };
  }

  private hash(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  private setMemory(key: string, value: string): void {
    if (this.memoryCache.size >= this.memoryCacheMax) {
      // Evicción simple: borrar el primer elemento (Map preserva inserción)
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey !== undefined) this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(key, value);
  }

  private async persistToDb(
    sourceText: string,
    targetLang: string,
    translatedText: string,
  ): Promise<void> {
    const sourceHash = this.hash(sourceText);
    try {
      await this.prisma.translationCache.upsert({
        where: { sourceHash },
        update: {},
        create: {
          sourceHash,
          sourceText: sourceText.slice(0, 65000), // Truncar para caber en TEXT
          targetLang,
          translatedText: translatedText.slice(0, 65000),
        },
      });
    } catch (e) {
      // El cache puede fallar por race conditions; ignorar silenciosamente
    }
  }
}
