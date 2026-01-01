import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        emailVerified: true,
        mfaEnabled: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existingUser = await this.findByEmail(dto.email);
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        avatarUrl: dto.avatarUrl,
        ...(dto.email && { email: dto.email.toLowerCase(), emailVerified: false }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        emailVerified: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`User updated: ${id}`);
    return updatedUser;
  }

  async softDelete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.$transaction([
      // Deactivate user
      this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      }),
      // Revoke all sessions
      this.prisma.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    this.logger.log(`User deactivated: ${id}`);
  }

  async getStats(userId: string) {
    const [sessionsCount, workspacesCount] = await Promise.all([
      this.prisma.session.count({
        where: { userId, revokedAt: null },
      }),
      this.prisma.workspaceMember.count({
        where: { userId },
      }),
    ]);

    return {
      activeSessions: sessionsCount,
      workspaces: workspacesCount,
    };
  }
}

