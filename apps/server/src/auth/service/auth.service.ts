import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../system/module/email/email.service';
import { Role } from '@prisma/client';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from '../dto';

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
  jti?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    emailVerified: boolean;
    avatarUrl: string | null;
  };
  tokens: TokenPair;
  workspace?: {
    id: string;
    name: string;
    plan: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 12;
  private readonly TOKEN_EXPIRY_24H = 24 * 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const emailVerifyToken = crypto.randomUUID();
    const emailVerifyExpiry = new Date(Date.now() + this.TOKEN_EXPIRY_24H);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          fullName: dto.fullName,
          emailVerifyToken,
          emailVerifyExpiry,
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress,
        },
      });

      const workspaceSlug = this.generateSlug(dto.fullName);
      const workspace = await tx.workspace.create({
        data: {
          name: `${dto.fullName}'s Workspace`,
          slug: workspaceSlug,
          ownerId: user.id,
          plan: 'free',
          members: {
            create: {
              userId: user.id,
              role: Role.OWNER,
            },
          },
        },
      });

      return { user, workspace };
    });

    const tokens = await this.generateTokenPair(result.user.id, result.user.email, ipAddress, userAgent);

    await this.emailService.sendVerificationEmail(
      result.user.email,
      result.user.fullName,
      emailVerifyToken
    );
    this.logger.log(`User registered: ${result.user.email}`);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        emailVerified: result.user.emailVerified,
        avatarUrl: result.user.avatarUrl,
      },
      tokens,
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
        plan: result.workspace.plan,
      },
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        ownedWorkspaces: {
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Please login using your OAuth provider');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.logAuditEvent(user.id, 'LOGIN_FAILED', 'user', user.id, { reason: 'invalid_password' }, ipAddress, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      ipAddress,
      userAgent,
      dto.rememberMe,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    await this.logAuditEvent(user.id, 'LOGIN_SUCCESS', 'user', user.id, {}, ipAddress, userAgent);

    const workspace = user.ownedWorkspaces[0];

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
        avatarUrl: user.avatarUrl,
      },
      tokens,
      workspace: workspace ? {
        id: workspace.id,
        name: workspace.name,
        plan: workspace.plan,
      } : undefined,
    };
  }

  async refreshToken(dto: RefreshTokenDto, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const tokenHash = this.hashToken(dto.refreshToken);

      const session = await this.prisma.session.findUnique({
        where: { refreshToken: tokenHash },
        include: { user: true },
      });

      if (!session) {
        this.logger.warn(`Refresh token reuse detected for user ${payload.sub}`);
        await this.prisma.session.updateMany({
          where: { userId: payload.sub, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException('Session invalid - all sessions revoked for security');
      }

      if (session.revokedAt) {
        this.logger.warn(`Attempted use of revoked token for user ${session.userId}`);
        await this.prisma.session.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException('Session revoked - all sessions revoked for security');
      }

      if (new Date() > session.expiresAt) {
        throw new UnauthorizedException('Session expired');
      }

      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });

      return this.generateTokenPair(session.userId, session.user.email, ipAddress, userAgent);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(sessionId: string): Promise<{ message: string }> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'All sessions logged out' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerifyExpiry && new Date() > user.emailVerifyExpiry) {
      throw new BadRequestException('Verification token expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const emailVerifyToken = crypto.randomUUID();
    const emailVerifyExpiry = new Date(Date.now() + this.TOKEN_EXPIRY_24H);

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifyToken, emailVerifyExpiry },
    });

    await this.emailService.sendVerificationEmail(user.email, user.fullName, emailVerifyToken);

    return { message: 'Verification email sent' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      return { message: 'If your email exists, you will receive a password reset link' };
    }

    const resetToken = crypto.randomUUID();
    const resetExpiry = new Date(Date.now() + this.TOKEN_EXPIRY_24H);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      },
    });

    await this.emailService.sendPasswordResetEmail(user.email, user.fullName, resetToken);

    return { message: 'If your email exists, you will receive a password reset link' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: dto.token },
    });

    if (!user) {
      throw new BadRequestException('Invalid reset token');
    }

    if (user.passwordResetExpiry && new Date() > user.passwordResetExpiry) {
      throw new BadRequestException('Reset token expired');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      }),
      this.prisma.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.emailService.sendPasswordChangedEmail(user.email, user.fullName);

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.emailService.sendPasswordChangedEmail(user.email, user.fullName);

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedWorkspaces: { take: 1, orderBy: { createdAt: 'asc' } },
        workspaceMembers: { include: { workspace: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt,
      workspaces: user.workspaceMembers.map((wm) => ({
        id: wm.workspace.id,
        name: wm.workspace.name,
        slug: wm.workspace.slug,
        role: wm.role,
        plan: wm.workspace.plan,
      })),
    };
  }

  // Private helpers
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateTokenPair(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string,
    rememberMe?: boolean,
  ): Promise<TokenPair> {
    const jti = crypto.randomUUID();
    const accessPayload: JwtPayload = { sub: userId, email, type: 'access' };
    const refreshPayload: JwtPayload = { sub: userId, email, type: 'refresh', jti };

    const accessExpiresIn = this.configService.get<string>('jwt.expiresIn') || '15m';
    const refreshExpiresIn = rememberMe ? '30d' : (this.configService.get<string>('jwt.refreshExpiresIn') || '7d');

    const accessToken = this.jwtService.sign(accessPayload, { expiresIn: accessExpiresIn as any });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: refreshExpiresIn as any,
    });

    const expiresInMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expiresInMs);
    const tokenHash = this.hashToken(refreshToken);

    await this.prisma.session.create({
      data: { 
        userId, 
        refreshToken: tokenHash, 
        tokenFamily: crypto.randomUUID(),
        expiresAt, 
        ipAddress, 
        userAgent,
      },
    });

    return { accessToken, refreshToken, expiresIn: this.parseExpiresIn(accessExpiresIn) };
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }

  private generateSlug(name: string): string {
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
  }

  private async logAuditEvent(
    userId: string | null,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata: object,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: { userId, action, resourceType, resourceId, metadata, ipAddress, userAgent },
      });
    } catch (error) {
      this.logger.error('Failed to log audit event', error);
    }
  }
}

