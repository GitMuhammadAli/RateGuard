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
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto';

interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthResponse {
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
  private readonly TOKEN_EXPIRY_24H = 24 * 60 * 60 * 1000; // 24 hours in ms

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user
   */
  async register(dto: RegisterDto, ipAddress?: string): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    // Generate email verification token
    const emailVerifyToken = uuidv4();
    const emailVerifyExpiry = new Date(Date.now() + this.TOKEN_EXPIRY_24H);

    // Create user in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
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

      // Create default workspace
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
              role: 'owner',
            },
          },
        },
      });

      return { user, workspace };
    });

    // Generate tokens
    const tokens = await this.generateTokenPair(result.user.id, result.user.email, ipAddress);

    // TODO: Send verification email
    this.logger.log(`User registered: ${result.user.email}, verification token: ${emailVerifyToken}`);

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

  /**
   * Login with email and password
   */
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    // Find user
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      // Log failed attempt for audit
      await this.logAuditEvent(user.id, 'LOGIN_FAILED', 'user', user.id, { reason: 'invalid_password' }, ipAddress, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens (extend expiry if rememberMe)
    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      ipAddress,
      userAgent,
      dto.rememberMe,
    );

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Log successful login
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

  /**
   * Refresh access token
   */
  async refreshToken(dto: RefreshTokenDto, ipAddress?: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Find session
      const session = await this.prisma.session.findUnique({
        where: { refreshToken: dto.refreshToken },
        include: { user: true },
      });

      if (!session || session.revokedAt) {
        throw new UnauthorizedException('Session expired or revoked');
      }

      if (new Date() > session.expiresAt) {
        throw new UnauthorizedException('Session expired');
      }

      // Rotate refresh token (invalidate old, create new)
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });

      // Generate new token pair
      return this.generateTokenPair(session.userId, session.user.email, ipAddress);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout - revoke session
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Revoke specific session
      await this.prisma.session.updateMany({
        where: {
          userId,
          refreshToken,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revoke all sessions
      await this.prisma.session.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }
  }

  /**
   * Verify email
   */
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

  /**
   * Resend verification email
   */
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

    const emailVerifyToken = uuidv4();
    const emailVerifyExpiry = new Date(Date.now() + this.TOKEN_EXPIRY_24H);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifyToken,
        emailVerifyExpiry,
      },
    });

    // TODO: Send verification email
    this.logger.log(`Verification email resent: ${user.email}, token: ${emailVerifyToken}`);

    return { message: 'Verification email sent' };
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If your email exists, you will receive a password reset link' };
    }

    const resetToken = uuidv4();
    const resetExpiry = new Date(Date.now() + this.TOKEN_EXPIRY_24H);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      },
    });

    // TODO: Send password reset email
    this.logger.log(`Password reset requested: ${user.email}, token: ${resetToken}`);

    return { message: 'If your email exists, you will receive a password reset link' };
  }

  /**
   * Reset password with token
   */
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

    // Update password and invalidate all sessions
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      }),
      // Invalidate all sessions (FR-1.11)
      this.prisma.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    this.logger.log(`Password reset completed: ${user.email}`);

    return { message: 'Password reset successfully' };
  }

  /**
   * Change password (authenticated)
   */
  async changePassword(userId: string, dto: ChangePasswordDto, ipAddress?: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);

    // Update password and invalidate all sessions (FR-1.11)
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

    await this.logAuditEvent(userId, 'PASSWORD_CHANGED', 'user', userId, {}, ipAddress);

    return { message: 'Password changed successfully' };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedWorkspaces: {
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
        workspaces: {
          include: {
            workspace: true,
          },
        },
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
      workspaces: user.workspaces.map((wm) => ({
        id: wm.workspace.id,
        name: wm.workspace.name,
        slug: wm.workspace.slug,
        role: wm.role,
        plan: wm.workspace.plan,
      })),
    };
  }

  // ========================================
  // Private helper methods
  // ========================================

  private async generateTokenPair(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string,
    rememberMe?: boolean,
  ): Promise<TokenPair> {
    const accessPayload: JwtPayload = { sub: userId, email, type: 'access' };
    const refreshPayload: JwtPayload = { sub: userId, email, type: 'refresh' };

    const accessExpiresIn = this.configService.get<string>('jwt.expiresIn') || '15m';
    // Remember me extends refresh token to 30 days (FR-1.8)
    const refreshExpiresIn = rememberMe ? '30d' : (this.configService.get<string>('jwt.refreshExpiresIn') || '7d');

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: refreshExpiresIn,
    });

    // Calculate expiry date
    const expiresInMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expiresInMs);

    // Store session
    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiresIn(accessExpiresIn),
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15 minutes

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
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const uniqueSuffix = uuidv4().slice(0, 8);
    return `${baseSlug}-${uniqueSuffix}`;
  }

  private async logAuditEvent(
    userId: string | null,
    action: string,
    resource: string,
    resourceId: string,
    details: object,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          resourceId,
          details,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log audit event', error);
    }
  }
}

