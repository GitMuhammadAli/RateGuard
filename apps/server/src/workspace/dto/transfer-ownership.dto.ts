import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferOwnershipDto {
  @ApiProperty({
    description: 'User ID of the new owner (must be existing workspace member)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'New owner ID must be a valid UUID' })
  newOwnerId: string;
}

