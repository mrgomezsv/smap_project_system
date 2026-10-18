import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import {
  CreateAlbumDto,
  QueryAlbumsDto,
  UpdateAlbumDto,
} from './gallery.dto';

const albumInclude = {
  photos: { orderBy: [{ position: 'asc' }, { id: 'asc' }] },
  products: {
    include: {
      product: {
        select: { id: true, title: true, img: true, publicated: true },
      },
    },
  },
} satisfies Prisma.GalleryAlbumInclude;

type AlbumWithRelations = Prisma.GalleryAlbumGetPayload<{
  include: typeof albumInclude;
}>;

/** "Cumple de Sofía 🎉" → "cumple-de-sofia" */
export function slugify(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 140) || 'album'
  );
}

@Injectable()
export class GalleryService {
  private readonly logger = new Logger(GalleryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
  ) {}

  // ---------- Lectura ----------

  /** Álbumes publicados (o todos, para admin), más recientes primero. */
  async list(query: QueryAlbumsDto, includeUnpublished = false) {
    const where: Prisma.GalleryAlbumWhereInput = includeUnpublished
      ? {}
      : { published: true, photos: { some: {} } };
    const take = query.take ?? 12;
    const skip = query.skip ?? 0;
    const [albums, total] = await Promise.all([
      this.prisma.galleryAlbum.findMany({
        where,
        orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: {
          photos: {
            orderBy: [{ position: 'asc' }, { id: 'asc' }],
            take: 4,
          },
          _count: { select: { photos: true } },
        },
      }),
      this.prisma.galleryAlbum.count({ where }),
    ]);

    const items = await Promise.all(
      albums.map(async (a) => {
        const cover = await this.resolveCover(a.coverPhotoId, a.photos);
        return {
          id: a.id,
          slug: a.slug,
          title: a.title,
          description: a.description,
          eventDate: a.eventDate,
          location: a.location,
          published: a.published,
          createdAt: a.createdAt,
          photoCount: a._count.photos,
          cover,
          preview: a.photos.slice(0, 4).map((p) => this.photoView(p)),
        };
      }),
    );
    return { items, total, skip, take };
  }

  async findBySlug(slug: string, includeUnpublished = false) {
    const album = await this.prisma.galleryAlbum.findUnique({
      where: { slug },
      include: albumInclude,
    });
    if (!album || (!album.published && !includeUnpublished)) {
      throw new NotFoundException('Álbum no encontrado');
    }
    return this.albumView(album, includeUnpublished);
  }

  async findById(id: number) {
    const album = await this.prisma.galleryAlbum.findUnique({
      where: { id },
      include: albumInclude,
    });
    if (!album) throw new NotFoundException(`Álbum #${id} no encontrado`);
    return this.albumView(album, true);
  }

  /** Álbumes publicados donde aparece un producto (para su página). */
  async listByProduct(productId: number) {
    const links = await this.prisma.galleryAlbumProduct.findMany({
      where: {
        productId: BigInt(productId),
        album: { published: true, photos: { some: {} } },
      },
      include: {
        album: {
          include: {
            photos: { orderBy: [{ position: 'asc' }, { id: 'asc' }], take: 6 },
            _count: { select: { photos: true } },
          },
        },
      },
      orderBy: { album: { eventDate: 'desc' } },
      take: 6,
    });
    return Promise.all(
      links.map(async ({ album: a }) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        eventDate: a.eventDate,
        photoCount: a._count.photos,
        cover: await this.resolveCover(a.coverPhotoId, a.photos),
        preview: a.photos.map((p) => this.photoView(p)),
      })),
    );
  }

  // ---------- Escritura (admin) ----------

  async create(dto: CreateAlbumDto) {
    const slug = await this.uniqueSlug(slugify(dto.title));
    const album = await this.prisma.galleryAlbum.create({
      data: {
        slug,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        eventDate: dto.eventDate ? new Date(`${dto.eventDate}T00:00:00Z`) : null,
        location: dto.location?.trim() || null,
        published: dto.published ?? false,
        products: dto.productIds?.length
          ? {
              create: [...new Set(dto.productIds)].map((id) => ({
                productId: BigInt(id),
              })),
            }
          : undefined,
      },
    });
    return this.findById(album.id);
  }

  async update(id: number, dto: UpdateAlbumDto) {
    const existing = await this.prisma.galleryAlbum.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException(`Álbum #${id} no encontrado`);

    if (dto.coverPhotoId !== undefined && dto.coverPhotoId !== null) {
      const photo = await this.prisma.galleryPhoto.findFirst({
        where: { id: dto.coverPhotoId, albumId: id },
        select: { id: true },
      });
      if (!photo) {
        throw new BadRequestException('La portada debe ser una foto del álbum');
      }
    }

    const data: Prisma.GalleryAlbumUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined)
      data.description = dto.description?.trim() || null;
    if (dto.eventDate !== undefined)
      data.eventDate = dto.eventDate
        ? new Date(`${dto.eventDate}T00:00:00Z`)
        : null;
    if (dto.location !== undefined) data.location = dto.location?.trim() || null;
    if (dto.published !== undefined) data.published = dto.published;
    if (dto.coverPhotoId !== undefined) data.coverPhotoId = dto.coverPhotoId;

    await this.prisma.$transaction(async (tx) => {
      await tx.galleryAlbum.update({ where: { id }, data });
      if (dto.productIds !== undefined) {
        await tx.galleryAlbumProduct.deleteMany({ where: { albumId: id } });
        const ids = [...new Set(dto.productIds ?? [])];
        if (ids.length) {
          await tx.galleryAlbumProduct.createMany({
            data: ids.map((pid) => ({ albumId: id, productId: BigInt(pid) })),
            skipDuplicates: true,
          });
        }
      }
    });
    return this.findById(id);
  }

  async remove(id: number) {
    const album = await this.prisma.galleryAlbum.findUnique({
      where: { id },
      include: { photos: { select: { path: true } } },
    });
    if (!album) throw new NotFoundException(`Álbum #${id} no encontrado`);
    await this.prisma.galleryAlbum.delete({ where: { id } }); // cascada a fotos y productos
    for (const p of album.photos) this.upload.deleteMedia(p.path);
    return { deleted: true, id };
  }

  async addPhotos(albumId: number, files: Express.Multer.File[]) {
    const album = await this.prisma.galleryAlbum.findUnique({
      where: { id: albumId },
      select: { id: true, slug: true },
    });
    if (!album) throw new NotFoundException(`Álbum #${albumId} no encontrado`);
    if (!files?.length) throw new BadRequestException('Agrega al menos una foto');

    const last = await this.prisma.galleryPhoto.aggregate({
      where: { albumId },
      _max: { position: true },
    });
    let position = (last._max.position ?? -1) + 1;

    const created = [];
    for (const file of files) {
      const saved = await this.upload.saveGalleryImage(file, album.slug);
      created.push(
        await this.prisma.galleryPhoto.create({
          data: {
            albumId,
            path: saved.path,
            width: saved.width,
            height: saved.height,
            position: position++,
          },
        }),
      );
    }
    await this.touch(albumId);
    return created.map((p) => this.photoView(p));
  }

  async reorderPhotos(albumId: number, photoIds: number[]) {
    const photos = await this.prisma.galleryPhoto.findMany({
      where: { albumId },
      select: { id: true },
    });
    const valid = new Set(photos.map((p) => p.id));
    if (photoIds.length !== valid.size || photoIds.some((id) => !valid.has(id))) {
      throw new BadRequestException('La lista debe incluir todas las fotos del álbum');
    }
    await this.prisma.$transaction(
      photoIds.map((id, index) =>
        this.prisma.galleryPhoto.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );
    await this.touch(albumId);
    return this.findById(albumId);
  }

  async updatePhoto(photoId: number, caption: string | null | undefined) {
    const photo = await this.prisma.galleryPhoto.findUnique({
      where: { id: photoId },
    });
    if (!photo) throw new NotFoundException(`Foto #${photoId} no encontrada`);
    const updated = await this.prisma.galleryPhoto.update({
      where: { id: photoId },
      data: { caption: caption?.trim() || null },
    });
    return this.photoView(updated);
  }

  async removePhoto(photoId: number) {
    const photo = await this.prisma.galleryPhoto.findUnique({
      where: { id: photoId },
    });
    if (!photo) throw new NotFoundException(`Foto #${photoId} no encontrada`);
    await this.prisma.$transaction([
      this.prisma.galleryPhoto.delete({ where: { id: photoId } }),
      // Si era la portada, el álbum vuelve a usar la primera foto
      this.prisma.galleryAlbum.updateMany({
        where: { id: photo.albumId, coverPhotoId: photoId },
        data: { coverPhotoId: null },
      }),
    ]);
    this.upload.deleteMedia(photo.path);
    return { deleted: true, id: photoId };
  }

  // ---------- Helpers ----------

  private photoView(p: {
    id: number;
    path: string;
    caption: string | null;
    width: number | null;
    height: number | null;
  }) {
    return {
      id: p.id,
      path: p.path,
      caption: p.caption,
      width: p.width,
      height: p.height,
    };
  }

  private async resolveCover(
    coverPhotoId: number | null,
    photos: Array<Parameters<GalleryService['photoView']>[0]>,
  ) {
    if (coverPhotoId) {
      const inList = photos.find((p) => p.id === coverPhotoId);
      if (inList) return this.photoView(inList);
      const cover = await this.prisma.galleryPhoto.findUnique({
        where: { id: coverPhotoId },
      });
      if (cover) return this.photoView(cover);
    }
    return photos[0] ? this.photoView(photos[0]) : null;
  }

  private albumView(album: AlbumWithRelations, includeUnpublished: boolean) {
    const photos = album.photos.map((p) => this.photoView(p));
    const cover =
      photos.find((p) => p.id === album.coverPhotoId) ?? photos[0] ?? null;
    return {
      id: album.id,
      slug: album.slug,
      title: album.title,
      description: album.description,
      eventDate: album.eventDate,
      location: album.location,
      published: album.published,
      coverPhotoId: album.coverPhotoId,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
      cover,
      photos,
      products: album.products
        .map((ap) => ap.product)
        .filter((p) => includeUnpublished || p.publicated)
        .map((p) => ({ id: Number(p.id), title: p.title, img: p.img })),
    };
  }

  private async uniqueSlug(base: string): Promise<string> {
    let slug = base;
    for (let n = 2; n < 200; n++) {
      const exists = await this.prisma.galleryAlbum.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!exists) return slug;
      slug = `${base.slice(0, 135)}-${n}`;
    }
    return `${base.slice(0, 130)}-${Date.now().toString(36)}`;
  }

  private async touch(albumId: number) {
    await this.prisma.galleryAlbum.update({
      where: { id: albumId },
      data: { updatedAt: new Date() },
    });
  }
}
