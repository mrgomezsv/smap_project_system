import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private readonly cache = new Map<string, string>();

  /**
   * Traduce un texto usando la API pública de Google Translate con caché en memoria.
   * Si falla por algún problema de red, retorna el texto original de forma segura.
   */
  async translate(text: string, targetLang: 'es' | 'en'): Promise<string> {
    if (!text || text.trim() === '') return text;

    const cacheKey = `${targetLang}:${text}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = (await res.json()) as any;
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedText = data[0]
          .map((chunk: any) => (Array.isArray(chunk) && chunk[0] ? chunk[0] : ''))
          .join('');

        if (translatedText) {
          this.cache.set(cacheKey, translatedText);
          return translatedText;
        }
      }
      return text;
    } catch (error) {
      this.logger.warn(`No se pudo traducir "${text.slice(0, 30)}...": ${error}`);
      return text;
    }
  }

  /**
   * Traduce title y description de un producto si lang es 'es' o 'en'.
   */
  async translateProduct<T extends { title: string; description?: string | null }>(
    product: T,
    targetLang?: string,
  ): Promise<T> {
    if (!targetLang || (targetLang !== 'es' && targetLang !== 'en')) {
      return product;
    }

    const [translatedTitle, translatedDesc] = await Promise.all([
      this.translate(product.title, targetLang),
      product.description ? this.translate(product.description, targetLang) : Promise.resolve(product.description),
    ]);

    return {
      ...product,
      title: translatedTitle,
      description: translatedDesc,
    };
  }
}
