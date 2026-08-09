import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { promises as fs, createWriteStream } from 'fs';
import { createHash, randomBytes } from 'crypto';
import { join, normalize, resolve, sep } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

export interface SaveDocumentInput {
  contractId: number;
  clientSlug: string;
  ownerLabel: string;
  kind: string;
  originalFilename: string;
  buffer: Buffer;
  mimeType?: string;
  extension?: string;
}

export interface SavedDocumentRecord {
  storagePath: string;
  absolutePath: string;
  sha256: string;
  sizeBytes: number;
  sanitizedFilename: string;
}

const SAFE_TEXT = /[^a-zA-Z0-9._-]/g;
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILENAME = 180;

export type DetectedMime =
  'application/pdf' | 'image/png' | 'image/jpeg' | 'unknown';

export function detectMimeFromBuffer(buffer: Buffer): DetectedMime {
  if (
    buffer.length >= 5 &&
    buffer.subarray(0, 5).toString('ascii') === '%PDF-'
  ) {
    return 'application/pdf';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }
  return 'unknown';
}

export function extensionForMime(mime: string): string | null {
  if (mime === 'application/pdf') return '.pdf';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return '.jpg';
  return null;
}

@Injectable()
export class ContractStorageService {
  private readonly logger = new Logger(ContractStorageService.name);
  private readonly rootDir: string;
  private readonly maxBytes: number;

  constructor() {
    const configured = process.env.CONTRACT_STORAGE_DIR?.trim();
    if (configured) {
      this.rootDir = resolve(configured);
    } else {
      this.rootDir = resolve(process.cwd(), 'private', 'contracts');
    }
    this.maxBytes = MAX_BYTES;
  }

  getRootDir(): string {
    return this.rootDir;
  }

  getMaxBytes(): number {
    return this.maxBytes;
  }

  buildRelativeDir(input: {
    ownerLabel: string;
    clientSlug: string;
    contractId: number;
    kind?: string;
  }): {
    ownerSegment: string;
    clientSegment: string;
    dateSegment: string;
    contractSegment: string;
  } {
    const ownerSegment = this.sanitizePathSegment(
      input.ownerLabel,
      'manual',
      80,
    );
    const clientSegment = this.sanitizePathSegment(
      input.clientSlug,
      'client',
      80,
    );
    const dateSegment = new Date().toISOString().slice(0, 10);
    const contractSegment = `contract-${input.contractId}`;
    return { ownerSegment, clientSegment, dateSegment, contractSegment };
  }

  buildFilename(
    kind: string,
    originalFilename: string,
    extension?: string,
  ): string {
    const base = this.sanitizeFilename(originalFilename).slice(0, 40);
    const tag = this.sanitizeFilename(kind).toLowerCase().slice(0, 30) || 'doc';
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = randomBytes(4).toString('hex');
    const safeExt =
      extension && extension.length <= 10 && /^.[a-z0-9.]+$/i.test(extension)
        ? extension.toLowerCase()
        : '';
    const strippedBase = safeExt
      ? base.replace(new RegExp(`${safeExt.replace('.', '\\.')}$`, 'i'), '')
      : base;
    return `${stamp}_${tag}_${random}${strippedBase ? `_${strippedBase}` : ''}${safeExt}`.slice(
      0,
      MAX_FILENAME,
    );
  }

  async save(input: SaveDocumentInput): Promise<SavedDocumentRecord> {
    if (!input.buffer || input.buffer.length === 0) {
      throw new BadRequestException('El archivo está vacío');
    }
    if (input.buffer.length > this.maxBytes) {
      throw new BadRequestException(
        `El archivo excede el tamaño máximo permitido (${this.maxBytes} bytes)`,
      );
    }

    const segments = this.buildRelativeDir({
      ownerLabel: input.ownerLabel,
      clientSlug: input.clientSlug,
      contractId: input.contractId,
      kind: input.kind,
    });

    const relativeDir = join(
      segments.ownerSegment,
      segments.clientSegment,
      segments.dateSegment,
      segments.contractSegment,
    );

    const absoluteDir = this.resolveInsideRoot(relativeDir);
    await fs.mkdir(absoluteDir, { recursive: true });

    const filename = this.buildFilename(
      input.kind,
      input.originalFilename,
      input.extension,
    );
    const absolutePath = join(absoluteDir, filename);
    const tempPath = `${absolutePath}.tmp-${randomBytes(4).toString('hex')}`;

    const sha256 = createHash('sha256').update(input.buffer).digest('hex');

    try {
      await pipeline(
        this.toReadable(input.buffer),
        createWriteStream(tempPath, { flags: 'wx' }),
      );
    } catch (err) {
      await this.safeUnlink(tempPath);
      this.logger.error(
        `No se pudo escribir archivo temporal ${tempPath}: ${(err as Error).message}`,
      );
      throw new InternalServerErrorException(
        'No se pudo almacenar el documento',
      );
    }

    try {
      await fs.rename(tempPath, absolutePath);
    } catch (err) {
      await this.safeUnlink(tempPath);
      this.logger.error(
        `No se pudo renombrar archivo temporal a ${absolutePath}: ${(err as Error).message}`,
      );
      throw new InternalServerErrorException(
        'No se pudo confirmar el documento',
      );
    }

    const storagePath = this.toStoragePath(join(relativeDir, filename));

    return {
      storagePath,
      absolutePath,
      sha256,
      sizeBytes: input.buffer.length,
      sanitizedFilename: filename,
    };
  }

  async read(storagePath: string): Promise<Buffer> {
    const absolute = this.resolveInsideRoot(storagePath);
    return fs.readFile(absolute);
  }

  async remove(storagePath: string): Promise<boolean> {
    const absolute = this.resolveInsideRoot(storagePath);
    try {
      await fs.unlink(absolute);
      return true;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        return true;
      }
      this.logger.warn(
        `No se pudo eliminar archivo ${absolute}: ${(err as Error).message}`,
      );
      return false;
    }
  }

  resolveInsideRoot(relativePath: string): string {
    const normalized = normalize(relativePath).replace(/^[/\\]+/, '');
    const absolute = resolve(this.rootDir, normalized);
    const rootWithSep = this.rootDir.endsWith(sep)
      ? this.rootDir
      : `${this.rootDir}${sep}`;
    if (!absolute.startsWith(rootWithSep) && absolute !== this.rootDir) {
      throw new BadRequestException('Ruta de almacenamiento inválida');
    }
    return absolute;
  }

  sanitizePathSegment(value: string, fallback: string, max: number): string {
    const trimmed = (value ?? '').toString().trim();
    let safe = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '');
    if (!safe) safe = fallback;
    if (safe.length > max) safe = safe.slice(0, max);
    return safe;
  }

  sanitizeFilename(value: string): string {
    let safe = (value ?? '').toString().trim();
    safe = safe.replace(SAFE_TEXT, '_');
    safe = safe.replace(/^[.]+|[-.]+$/g, '');
    if (!safe) safe = 'document';
    if (safe.length > MAX_FILENAME) safe = safe.slice(0, MAX_FILENAME);
    return safe;
  }

  toStoragePath(absoluteOrRelative: string): string {
    const normalized = normalize(absoluteOrRelative).replace(/^[/\\]+/, '');
    if (normalized.startsWith(this.rootDir)) {
      return normalized.slice(this.rootDir.length).replace(/^[/\\]+/, '');
    }
    return normalized;
  }

  private async safeUnlink(path: string): Promise<void> {
    try {
      await fs.unlink(path);
    } catch {
      void 0;
    }
  }

  private toReadable(buffer: Buffer): NodeJS.ReadableStream {
    return Readable.from(buffer);
  }
}
