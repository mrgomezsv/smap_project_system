import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsNumber,
  IsObject,
  IsInt,
  IsDateString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContractDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  clientId?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  clientName!: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  clientEmail!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  clientPhone?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  clientAddress!: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  clientCityStateZip?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  driverLicense?: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  startTime?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  endTime?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  equipment!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  groundType?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  deposit?: number;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  notes?: string;
}

export class SignContractDto {
  @IsString()
  @IsNotEmpty()
  signatureImage!: string;

  @IsObject()
  @IsOptional()
  safetyChecklist?: Record<string, boolean>;
}

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  clientName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  clientEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  clientPhone?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  clientAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  clientCityStateZip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  driverLicense?: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  startTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  endTime?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  equipment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  groundType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deposit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}

export class CancelContractDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

export class ArchiveContractDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}

export class ResendContractDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CreateContractPaymentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  type!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  method!: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  reference?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}

export class DeletePaymentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

export class DeleteDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

export class HardDeleteContractDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

export class UploadContractDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  kind!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  paymentId?: number;

  @IsOptional()
  @IsDateString()
  signedAt?: string;
}

export class QueryContractsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

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

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  cursor?: number;
}
