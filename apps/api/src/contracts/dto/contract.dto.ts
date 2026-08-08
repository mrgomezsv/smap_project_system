import { IsString, IsNotEmpty, IsOptional, IsEmail, IsNumber, IsObject } from 'class-validator';

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  clientName!: string;

  @IsEmail()
  @IsNotEmpty()
  clientEmail!: string;

  @IsString()
  @IsOptional()
  clientPhone?: string;

  @IsString()
  @IsNotEmpty()
  clientAddress!: string;

  @IsString()
  @IsOptional()
  clientCityStateZip?: string;

  @IsString()
  @IsOptional()
  driverLicense?: string;

  @IsString()
  @IsOptional()
  eventDate?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsNotEmpty()
  equipment!: string;

  @IsString()
  @IsOptional()
  groundType?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  deposit?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class SignContractDto {
  @IsString()
  @IsNotEmpty()
  signatureImage!: string;

  @IsObject()
  @IsOptional()
  safetyChecklist?: Record<string, boolean>;

  @IsString()
  @IsOptional()
  signerIp?: string;

  @IsString()
  @IsOptional()
  signerUserAgent?: string;
}
