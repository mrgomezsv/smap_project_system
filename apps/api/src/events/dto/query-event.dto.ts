import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryEventDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === 'true' || value === true || value === 1 || value === '1';
  })
  published?: boolean;

  @IsOptional()
  @IsString()
  partners?: string;

  /**
   * Solo eventos de hoy en adelante (hora de El Salvador). El controlador lo
   * fuerza para visitantes; un evento de hoy deja de mostrarse a las 00:00
   * del día siguiente.
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === 'true' || value === true || value === 1 || value === '1';
  })
  upcoming?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  skip?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  take?: number;
}
