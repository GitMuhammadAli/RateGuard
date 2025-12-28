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
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto';

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
  jti?: string; // JWT ID - unique identifier for refresh tokens
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
  private readonly TOKEN_EXPIRY_24H = 24 * 60 * 60 * 1000; // 24 hours in ms

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
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
    const emailVerifyToken = crypto.randomUUID();
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

    // Send verification email
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
   * 
   * SECURITY: We store a HASH of the refresh token in the database.
   * The client sends the actual token, we hash it and compare.
   * This way, even if the database is compromised, tokens can't be used.
   */
  async refreshToken(dto: RefreshTokenDto, ipAddress?: string): Promise<TokenPair> {
    try {
      // 1. Verify JWT signature and structure
      const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // 2. Hash the incoming token to compare with database
      const tokenHash = this.hashToken(dto.refreshToken);

      // 3. Find session by token hash
      const session = await this.prisma.session.findUnique({
        where: { refreshToken: tokenHash },
        include: { user: true },
      });

      if (!session) {
        // 🔴 SECURITY: Token not found - might be stolen and already used!
        // Revoke ALL sessions for this user as a precaution
        this.logger.warn(`Refresh token reuse detected for user ${payload.sub}`);
        await this.prisma.session.updateMany({
          where: { userId: payload.sub, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException('Session invalid - all sessions revoked for security');
      }

      if (session.revokedAt) {
        // 🔴 SECURITY: Attempting to use revoked token - possible theft!
        this.logger.warn(`Attempted use of revoked token for user ${session.userId}`);
        // Revoke ALL sessions as this might be token theft
        await this.prisma.session.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException('Session revoked - all sessions revoked for security');
      }

      if (new Date() > session.expiresAt) {
        throw new UnauthorizedException('Session expired');
      }

      // 4. Check if IP changed significantly (optional additional security)
      if (ipAddress && session.ipAddress && session.ipAddress !== ipAddress) {
        this.logger.warn(`IP change detected for session ${session.id}: ${session.ipAddress} -> ${ipAddress}`);
        // You could add additional verification here (e.g., require re-authentication)
      }

      // 5. Rotate token - revoke old, create new
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });

      // 6. Generate new token pair
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
      // Hash the token to find in database
      const tokenHash = this.hashToken(refreshToken);
      
      // Revoke specific session
      await this.prisma.session.updateMany({
        where: {
          userId,
          refreshToken: tokenHash,
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

    const emailVerifyToken = crypto.randomUUID();
    const emailVerifyExpiry = new Date(Date.now() + this.TOKEN_EXPIRY_24H);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifyToken,
        emailVerifyExpiry,
      },
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      user.fullName,
      emailVerifyToken
    );
    this.logger.log(`Verification email resent: ${user.email}`);

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

    const resetToken = crypto.randomUUID();
    const resetExpiry = new Date(Date.now() + this.TOKEN_EXPIRY_24H);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      },
    });

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.fullName,
      resetToken
    );
    this.logger.log(`Password reset requested: ${user.email}`);

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

    // Send confirmation email
    await this.emailService.sendPasswordChangedEmail(user.email, user.fullName);
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

    // Send confirmation email
    await this.emailService.sendPasswordChangedEmail(user.email, user.fullName);
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

  /**
   * Hash a token for secure database storage
   * We use SHA-256 which is fast but secure for this use case
   */
  private hashToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  private async generateTokenPair(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string,
    rememberMe?: boolean,
  ): Promise<TokenPair> {
    // Generate unique JWT ID for refresh token (for tracking)
    const jti = crypto.randomUUID();
    
    const accessPayload: JwtPayload = { sub: userId, email, type: 'access' };
    const refreshPayload: JwtPayload = { sub: userId, email, type: 'refresh', jti };

    const accessExpiresIn = this.configService.get<string>('jwt.expiresIn') || '15m';
    // Remember me extends refresh token to 30 days (FR-1.8)
    const refreshExpiresIn = rememberMe ? '30d' : (this.configService.get<string>('jwt.refreshExpiresIn') || '7d');

    const accessToken = this.jwtService.sign(accessPayload, {
      // Nest v11 typings require number | StringValue; we provide a string literal like '15m'
      expiresIn: accessExpiresIn as any,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: refreshExpiresIn as any,
    });

    // Calculate expiry date
    const expiresInMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expiresInMs);

    // 🔴 SECURITY: Store HASH of refresh token, not the token itself
    const tokenHash = this.hashToken(refreshToken);

    // Store session with hashed token
    await this.prisma.session.create({
      data: {
        userId,
        refreshToken: tokenHash,  // ← HASHED, not plain text!
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,  // ← Client gets the actual token
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
    const uniqueSuffix = crypto.randomUUID().slice(0, 8);
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
