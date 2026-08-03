import { join, resolve } from 'path';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  const previousUploadDir = process.env.UPLOAD_DIR;

  afterEach(() => {
    if (previousUploadDir === undefined) {
      delete process.env.UPLOAD_DIR;
    } else {
      process.env.UPLOAD_DIR = previousUploadDir;
    }
  });

  it('conserva product_images en la ruta relativa', () => {
    process.env.UPLOAD_DIR = '/tmp/kidsfun-media';
    const service = new UploadService();
    const file = join('/tmp/kidsfun-media', 'product_images', 'barbie', 'barbie_01.jpeg');

    expect(service.toRelativePath(file)).toBe('product_images/barbie/barbie_01.jpeg');
  });

  it('rechaza rutas fuera del directorio media', () => {
    process.env.UPLOAD_DIR = '/tmp/kidsfun-media';
    const service = new UploadService();

    expect(() => service.toRelativePath('/tmp/otro-proyecto/archivo.jpeg')).toThrow(
      'Ruta de archivo fuera del directorio de uploads',
    );
  });

  it('genera nombres sin depender del slug multipart', () => {
    process.env.UPLOAD_DIR = resolve('/tmp/kidsfun-media');
    const service = new UploadService();
    const filename = service.createFilename('.JPEG');

    expect(filename).toMatch(/^[a-f0-9]{32}\.jpeg$/);
  });
});
