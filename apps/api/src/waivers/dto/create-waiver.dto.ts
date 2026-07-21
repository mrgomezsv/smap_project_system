import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsArray,
  ValidateNested,
  Min,
  IsInt,
  IsOptional,
  Matches,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RelativeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsInt()
  @Min(0)
  @Max(120)
  age!: number;
}

export class CreateWaiverDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  userName!: string;

  @IsEmail()
  @MaxLength(255)
  userEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[+\d()\-\s]*$/, {
    message: 'userPhone solo puede contener dígitos, espacios, +, (, ) y -',
  })
  userPhone?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RelativeDto)
  relatives!: RelativeDto[];
}
