import { AlbumEditor } from '@/components/admin/AlbumEditor';

export const metadata = { title: 'Nuevo álbum - Admin' };

export default function NuevoAlbumPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">Nuevo álbum</h1>
        <p className="text-text-muted mt-1">
          Primero los datos de la fiesta; después podrás subir las fotos.
        </p>
      </header>
      <AlbumEditor />
    </div>
  );
}
