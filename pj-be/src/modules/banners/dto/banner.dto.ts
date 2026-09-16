import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export const BANNER_PLACEMENTS = ['home_slot', 'breadcrumb'] as const;
export const BANNER_LOCALES = ['vi', 'en', 'ko'] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];
export type BannerLocale = (typeof BANNER_LOCALES)[number];

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (['true', '1', 'yes', 'on'].includes(value.toLowerCase())) return true;
    if (['false', '0', 'no', 'off'].includes(value.toLowerCase())) return false;
  }
  return undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export class BannerResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() nameVi!: string;
  @ApiPropertyOptional() nameEn!: string | null;
  @ApiPropertyOptional() nameKo!: string | null;
  @ApiProperty({ enum: BANNER_PLACEMENTS }) placement!: BannerPlacement;
  @ApiPropertyOptional() slotNumber!: number | null;
  @ApiPropertyOptional() spaId!: string | null;
  @ApiProperty() imageUrl!: string;
  @ApiProperty() imageUrlVi!: string;
  @ApiPropertyOptional() imageUrlEn!: string | null;
  @ApiPropertyOptional() imageUrlKo!: string | null;
  @ApiProperty() targetUrl!: string;
  @ApiPropertyOptional() gaClickTag!: string | null;
  @ApiProperty() isEnabled!: boolean;
  @ApiProperty() displayOrder!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class BannerListQueryDto {
  @ApiPropertyOptional({ enum: BANNER_PLACEMENTS })
  @IsOptional()
  @IsIn(BANNER_PLACEMENTS)
  placement?: BannerPlacement;

  @ApiPropertyOptional({ enum: BANNER_LOCALES, default: 'vi' })
  @IsOptional()
  @IsIn(BANNER_LOCALES)
  locale?: BannerLocale;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  enabledOnly?: boolean;

  @ApiPropertyOptional({ type: Number, description: 'Vĩ độ của user để tính khoảng cách' })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @Type(() => Number)
  lat?: number;

  @ApiPropertyOptional({ type: Number, description: 'Kinh độ của user để tính khoảng cách' })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @Type(() => Number)
  lng?: number;
}

export class UpsertBannerDto {
  @ApiPropertyOptional({ deprecated: true, description: 'Legacy field. Backend derives it from nameVi.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nameVi!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameEn?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameKo?: string | null;

  @ApiProperty({ enum: BANNER_PLACEMENTS })
  @IsIn(BANNER_PLACEMENTS)
  placement!: BannerPlacement;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => value === '' || value == null ? null : toNumber(value))
  @IsInt()
  @Min(1)
  @Max(8)
  slotNumber?: number | null;

  @ApiPropertyOptional({ description: 'ID của Spa (nếu banner thuộc 1 spa cụ thể)' })
  @IsOptional()
  @Transform(({ value }) => value === '' || value == null ? null : value)
  @IsUUID()
  spaId?: string | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^(https?:\/\/|\/).+/i, { message: 'targetUrl must start with http(s):// or /' })
  targetUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  gaClickTag?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value == null || value === '' ? true : toBoolean(value))
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value == null || value === '' ? 0 : toNumber(value))
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class ReorderBannerItemDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  id!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  displayOrder!: number;
}

export class ReorderBannersDto {
  @ApiProperty({ type: ReorderBannerItemDto, isArray: true })
  @IsArray()
  @Type(() => ReorderBannerItemDto)
  @ValidateNested({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [])
  items!: ReorderBannerItemDto[];
}
