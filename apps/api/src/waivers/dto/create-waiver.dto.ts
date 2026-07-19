import { IsString, IsNotEmpty, IsEmail, IsArray, ValidateNested, Min, IsInt, Max, MaxLength } from 'class-validator';
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RelativeDto)
  relatives!: RelativeDto[];
}
