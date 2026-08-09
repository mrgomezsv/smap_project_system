import { Test } from '@nestjs/testing';
import { promises as fs } from 'fs';
import { mkdtemp, rm, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  ContractStorageService,
  detectMimeFromBuffer,
  extensionForMime,
} from './contract-storage.service';

describe('ContractStorageService', () => {
  let service: ContractStorageService;
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'contract-storage-'));
    process.env.CONTRACT_STORAGE_DIR = root;
    const module = await Test.createTestingModule({
      providers: [ContractStorageService],
    }).compile();
    service = module.get(ContractStorageService);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
    delete process.env.CONTRACT_STORAGE_DIR;
  });

  it('expone rootDir y maxBytes configurados', () => {
    expect(service.getRootDir()).toBe(root);
    expect(service.getMaxBytes()).toBe(10 * 1024 * 1024);
  });

  it('guarda archivo en estructura sanitizada y devuelve sha256 correcto', async () => {
    const buffer = Buffer.from('%PDF-1.4 fake content for pdf');
    const result = await service.save({
      contractId: 42,
      ownerLabel: '7-Ana Pérez',
      clientSlug: 'Ana Pérez / San Antonio',
      kind: 'ISSUED_PDF',
      originalFilename: 'agreement.pdf',
      buffer,
      extension: '.pdf',
    });

    expect(result.sizeBytes).toBe(buffer.length);
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.sanitizedFilename).toMatch(/\.pdf$/);
    expect(result.storagePath).toMatch(
      /^7-ana-p-rez\/ana-p-rez-san-antonio\/\d{4}-\d{2}-\d{2}\/contract-42\//,
    );

    const absolute = join(root, result.storagePath);
    const written = await readFile(absolute);
    expect(written.equals(buffer)).toBe(true);
  });

  it('rechaza traversal al construir storagePath', async () => {
    await expect(
      service.save({
        contractId: 1,
        ownerLabel: 'manual',
        clientSlug: 'manual',
        kind: 'OTHER',
        originalFilename: 'doc.png',
        buffer: Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3,
        ]),
      }),
    ).resolves.toBeDefined();

    await expect(service.read('../package.json')).rejects.toThrow();
    await expect(service.remove('../etc/passwd')).rejects.toThrow(/inválida/i);
  });

  it('rechaza archivos vacíos o que exceden el límite', async () => {
    await expect(
      service.save({
        contractId: 1,
        ownerLabel: 'manual',
        clientSlug: 'manual',
        kind: 'OTHER',
        originalFilename: 'doc.png',
        buffer: Buffer.alloc(0),
      }),
    ).rejects.toThrow(/vacío/i);

    const big = Buffer.alloc(11 * 1024 * 1024);
    await expect(
      service.save({
        contractId: 1,
        ownerLabel: 'manual',
        clientSlug: 'manual',
        kind: 'OTHER',
        originalFilename: 'doc.png',
        buffer: big,
      }),
    ).rejects.toThrow(/excede/i);
  });

  it('lee y elimina archivos existentes', async () => {
    const buffer = Buffer.from('%PDF-1.4 hello world');
    const result = await service.save({
      contractId: 2,
      ownerLabel: 'manual',
      clientSlug: 'manual',
      kind: 'PAYMENT_RECEIPT',
      originalFilename: 'receipt.pdf',
      buffer,
      extension: '.pdf',
    });

    const read = await service.read(result.storagePath);
    expect(read.equals(buffer)).toBe(true);

    const removed = await service.remove(result.storagePath);
    expect(removed).toBe(true);
    await expect(service.read(result.storagePath)).rejects.toThrow();
    await expect(fs.stat(join(root, result.storagePath))).rejects.toThrow();
  });

  it('remove es idempotente para archivos inexistentes', async () => {
    const removed = await service.remove('does/not/exist.pdf');
    expect(removed).toBe(true);
  });

  it('construye nombre sin duplicar extensión del filename original', () => {
    const f1 = service.buildFilename('ISSUED_PDF', 'agreement.pdf', '.pdf');
    const f2 = service.buildFilename('ISSUED_PDF', 'agreement', '.pdf');
    expect(f1).toMatch(/\.pdf$/);
    expect(f2).toMatch(/\.pdf$/);
    expect(f1).not.toMatch(/\.pdf\.pdf$/);
    expect(f2).not.toMatch(/\.pdf\.pdf$/);
  });

  it('detectMimeFromBuffer detecta PDF/PNG/JPEG', () => {
    expect(detectMimeFromBuffer(Buffer.from('%PDF-1.4'))).toBe(
      'application/pdf',
    );
    expect(
      detectMimeFromBuffer(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe('image/png');
    expect(detectMimeFromBuffer(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      'image/jpeg',
    );
    expect(detectMimeFromBuffer(Buffer.from('whatever'))).toBe('unknown');
  });

  it('extensionForMime devuelve extensión correcta', () => {
    expect(extensionForMime('application/pdf')).toBe('.pdf');
    expect(extensionForMime('image/png')).toBe('.png');
    expect(extensionForMime('image/jpeg')).toBe('.jpg');
    expect(extensionForMime('image/jpg')).toBe('.jpg');
    expect(extensionForMime('text/plain')).toBeNull();
  });
});
