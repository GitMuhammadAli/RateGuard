import { IsString, IsOptional, MaxLength, MinLength, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({
    description: 'Workspace display name',
    example: 'My Renamed Startup',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(50, { message: 'Name must be at most 50 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Workspace description',
    example: 'Updated description for our workspace',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Logo URL',
    example: 'https://example.com/new-logo.png',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Workspace settings (JSON)',
    example: { theme: 'dark', notifications: true },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

