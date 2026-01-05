import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class InviteMemberDto {
  @ApiProperty({
    description: 'Email address of the user to invite',
    example: 'teammate@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiPropertyOptional({
    description: 'Role to assign to the invited member',
    enum: ['ADMIN', 'DEVELOPER', 'VIEWER'],
    default: 'DEVELOPER',
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Role must be ADMIN, DEVELOPER, or VIEWER' })
  role?: Role = Role.DEVELOPER;
}

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Invitation token from the invite link',
  })
  token: string;
}

