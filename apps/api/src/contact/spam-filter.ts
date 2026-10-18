/**
 * Heurísticas anti-spam para el formulario de contacto público.
 * Devuelve el motivo si el mensaje parece spam, o null si es legítimo.
 *
 * Patrón real observado (sep-oct 2026): nombre de 12 letras aleatorias con
 * mayúsculas intercaladas ("KdnxAcKjincm") y un mensaje que es solo un
 * número de 10 dígitos, enviados por un bot.
 */
export interface ContactSpamInput {
  firstName: string;
  lastName: string;
  reason: string;
  /** Campo trampa (oculto en el formulario): una persona nunca lo llena. */
  website?: string;
  /** Epoch ms en que se mostró el formulario. */
  formStartedAt?: number;
}

/** Tiempo mínimo que tarda una persona en llenar el formulario. */
const MIN_FILL_MS = 3000;

/** Nombre aleatorio: palabra larga con mayúsculas intercaladas o sin vocales. */
function looksRandom(name: string): boolean {
  return name
    .trim()
    .split(/\s+/)
    .some((word) => {
      if (word.length < 8 || !/^[a-z]+$/i.test(word)) return false;
      const innerUppercase = (word.slice(1).match(/[A-Z]/g) ?? []).length;
      const hasVowels = /[aeiouáéíóú]/i.test(word);
      return innerUppercase >= 3 || !hasVowels;
    });
}

export function detectContactSpam(input: ContactSpamInput): string | null {
  if (input.website && input.website.trim() !== '') return 'honeypot';

  if (
    typeof input.formStartedAt === 'number' &&
    Date.now() - input.formStartedAt < MIN_FILL_MS
  ) {
    return 'enviado demasiado rápido';
  }

  // Un mensaje real tiene al menos una palabra (el bot manda solo dígitos)
  if (!/\p{L}{2,}/u.test(input.reason)) return 'mensaje sin texto';

  if (looksRandom(input.firstName) || looksRandom(input.lastName)) {
    return 'nombre aleatorio';
  }

  return null;
}
