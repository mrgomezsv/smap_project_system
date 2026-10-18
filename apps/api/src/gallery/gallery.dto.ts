import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateAlbumDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  /** Fecha de la fiesta (YYYY-MM-DD) */
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== '')
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'eventDate debe ser YYYY-MM-DD' })
  eventDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  /** Productos que aparecen en las fotos */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsInt({ each: true })
  @Type(() => Number)
  productIds?: number[];
}

export class UpdateAlbumDto extends PartialType(CreateAlbumDto) {
  /** Foto de portada (id de una foto del álbum) o null para usar la primera */
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsInt()
  coverPhotoId?: number | null;
}

export class ReorderPhotosDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsInt({ each: true })
  @Type(() => Number)
  photoIds!: number[];
}

export class UpdatePhotoDto {
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  @MaxLength(255)
  caption?: string | null;
}

export class QueryAlbumsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number;
}
