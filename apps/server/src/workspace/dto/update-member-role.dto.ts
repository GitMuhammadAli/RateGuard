import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'New role for the member',
    enum: ['ADMIN', 'DEVELOPER', 'VIEWER'],
    example: 'ADMIN',
  })
  @IsEnum(Role, { message: 'Role must be OWNER, ADMIN, DEVELOPER, or VIEWER' })
  role: Role;
}

