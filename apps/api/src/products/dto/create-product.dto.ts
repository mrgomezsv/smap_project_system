import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dimensions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  space?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  circuits?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  youtubeUrl?: string;

  @IsOptional()
  @IsBoolean()
  publicated?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  img?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  img1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  img2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  img3?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  img4?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  img5?: string;
}
