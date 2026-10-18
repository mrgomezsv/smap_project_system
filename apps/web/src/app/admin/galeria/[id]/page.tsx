import { AlbumEditor } from '@/components/admin/AlbumEditor';

export const metadata = { title: 'Editar álbum - Admin' };

export default function EditarAlbumPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">Editar álbum</h1>
      </header>
      <AlbumEditor albumId={Number(params.id)} />
    </div>
  );
}
