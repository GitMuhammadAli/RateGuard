import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../system/module/email/email.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  TransferOwnershipDto,
} from '../dto';
import { randomBytes } from 'crypto';

@Injectable()
export class WorkspaceService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // ==========================================
  // WORKSPACE CRUD
  // ==========================================

  /**
   * Create a new workspace - creator becomes OWNER
   */
  async create(userId: string, dto: CreateWorkspaceDto) {
    // Generate slug if not provided
    const slug = dto.slug || this.generateSlug(dto.name);

    // Check if slug is unique
    const existingWorkspace = await this.prisma.workspace.findUnique({
      where: { slug },
    });

    if (existingWorkspace) {
      throw new ConflictException(
        `Workspace with slug "${slug}" already exists. Please choose a different name or slug.`,
      );
    }

    // Create workspace with owner
    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        logoUrl: dto.logoUrl,
        ownerId: userId,
        // Owner is automatically a member with OWNER role
        members: {
          create: {
            userId,
            role: Role.OWNER,
          },
        },
      },
      include: {
        owner: {
          select: { id: true, email: true, fullName: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { members: true, providers: true, projects: true, apiKeys: true },
        },
      },
    });

    return workspace;
  }

  /**
   * List all workspaces for a user (owned or member of)
   */
  async findAllForUser(userId: string) {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        deletedAt: null,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        owner: {
          select: { id: true, email: true, fullName: true },
        },
        members: {
          where: { userId },
          select: { role: true },
        },
        _count: {
          select: { members: true, providers: true, projects: true, apiKeys: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Transform to include user's role
    return workspaces.map((w) => ({
      ...w,
      myRole: w.ownerId === userId ? Role.OWNER : w.members[0]?.role,
      members: undefined, // Remove members array, we only used it for role
    }));
  }

  /**
   * Get workspace by ID with full details
   */
  async findById(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId, deletedAt: null },
      include: {
        owner: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true, avatarUrl: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: {
          select: { 
            members: true, 
            providers: true, 
            projects: true, 
            apiKeys: true,
            invitations: { where: { acceptedAt: null, declinedAt: null } },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  /**
   * Get workspace by slug
   */
  async findBySlug(slug: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug, deletedAt: null },
      include: {
        owner: {
          select: { id: true, email: true, fullName: true },
        },
        _count: {
          select: { members: true, providers: true, projects: true, apiKeys: true },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  /**
   * Update workspace - ADMIN+ only (checked by guard)
   */
  async update(workspaceId: string, dto: UpdateWorkspaceDto) {
    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: dto.name,
        description: dto.description,
        logoUrl: dto.logoUrl,
        settings: dto.settings,
      },
      include: {
        owner: {
          select: { id: true, email: true, fullName: true },
        },
        _count: {
          select: { members: true, providers: true, projects: true, apiKeys: true },
        },
      },
    });

    return workspace;
  }

  /**
   * Delete workspace - OWNER only (soft delete)
   */
  async delete(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true, name: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Double-check ownership (guard should have already checked)
    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can delete it');
    }

    // Soft delete
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt: new Date() },
    });

    return { message: `Workspace "${workspace.name}" has been deleted` };
  }

  // ==========================================
  // MEMBER MANAGEMENT
  // ==========================================

  /**
   * List workspace members
   */
  async listMembers(workspaceId: string) {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { 
            id: true, 
            email: true, 
            fullName: true, 
            avatarUrl: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, etc.
        { joinedAt: 'asc' },
      ],
    });

    return members;
  }

  /**
   * Invite a new member - ADMIN+ only
   */
  async inviteMember(
    workspaceId: string,
    inviterId: string,
    dto: InviteMemberDto,
  ) {
    // Can't invite as OWNER
    if (dto.role === Role.OWNER) {
      throw new BadRequestException(
        'Cannot invite someone as OWNER. Use transfer ownership instead.',
      );
    }

    // Check if user with email exists
    const invitee = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, fullName: true },
    });

    // If user exists, check if already a member
    if (invitee) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: invitee.id,
          },
        },
      });

      if (existingMember) {
        throw new ConflictException('This user is already a member of this workspace');
      }
    }

    // Check for existing pending invitation
    const existingInvite = await this.prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email: dto.email,
        acceptedAt: null,
        declinedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new ConflictException(
        'An invitation for this email is already pending',
      );
    }

    // Create invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to accept

    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email: dto.email,
        role: dto.role || Role.DEVELOPER,
        token,
        expiresAt,
        invitedBy: inviterId,
      },
      include: {
        workspace: { select: { name: true } },
        inviter: { select: { fullName: true, email: true } },
      },
    });

    // Send invitation email
    await this.emailService.sendWorkspaceInvitation({
      to: dto.email,
      workspaceName: invitation.workspace.name,
      inviterName: invitation.inviter.fullName,
      role: dto.role || Role.DEVELOPER,
      token,
    });

    return {
      message: `Invitation sent to ${dto.email}`,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    };
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(userId: string, token: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: { select: { id: true, name: true } },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('This invitation has already been accepted');
    }

    if (invitation.declinedAt) {
      throw new BadRequestException('This invitation has been declined');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('This invitation has expired');
    }

    // Get user's email to verify
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user?.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }

    // Check if already a member
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId,
        },
      },
    });

    if (existingMember) {
      // Mark invitation as accepted anyway
      await this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return {
        message: 'You are already a member of this workspace',
        workspace: invitation.workspace,
      };
    }

    // Create membership and mark invitation as accepted
    await this.prisma.$transaction([
      this.prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
      }),
      this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return {
      message: `You have joined ${invitation.workspace.name}`,
      workspace: invitation.workspace,
      role: invitation.role,
    };
  }

  /**
   * Decline an invitation
   */
  async declineInvitation(userId: string, token: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Get user's email to verify
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user?.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }

    await this.prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { declinedAt: new Date() },
    });

    return { message: 'Invitation declined' };
  }

  /**
   * Cancel a pending invitation - ADMIN+ only
   */
  async cancelInvitation(workspaceId: string, invitationId: string) {
    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: {
        id: invitationId,
        workspaceId,
        acceptedAt: null,
        declinedAt: null,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Pending invitation not found');
    }

    await this.prisma.workspaceInvitation.delete({
      where: { id: invitationId },
    });

    return { message: 'Invitation cancelled' };
  }

  /**
   * List pending invitations - ADMIN+ only
   */
  async listInvitations(workspaceId: string) {
    const invitations = await this.prisma.workspaceInvitation.findMany({
      where: {
        workspaceId,
        acceptedAt: null,
        declinedAt: null,
      },
      include: {
        inviter: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      ...inv,
      isExpired: inv.expiresAt < new Date(),
    }));
  }

  /**
   * Update member role - OWNER only
   * Cannot change owner's role, cannot promote to OWNER (use transfer)
   */
  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    requesterId: string,
    dto: UpdateMemberRoleDto,
  ) {
    // Get workspace to check owner
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Can't change to OWNER role
    if (dto.role === Role.OWNER) {
      throw new BadRequestException(
        'Cannot promote to OWNER. Use transfer ownership instead.',
      );
    }

    // Get the membership
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
      include: { user: { select: { id: true, fullName: true } } },
    });

    if (!membership || membership.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace');
    }

    // Can't change owner's role
    if (membership.userId === workspace.ownerId) {
      throw new BadRequestException("Cannot change the owner's role");
    }

    // Update the role
    const updated = await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    return {
      message: `${updated.user.fullName}'s role changed to ${dto.role}`,
      member: updated,
    };
  }

  /**
   * Remove a member - ADMIN+ only
   * Cannot remove the owner
   */
  async removeMember(
    workspaceId: string,
    memberId: string,
    requesterId: string,
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
      include: { user: { select: { id: true, fullName: true } } },
    });

    if (!membership || membership.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace');
    }

    // Can't remove the owner
    if (membership.userId === workspace.ownerId) {
      throw new BadRequestException('Cannot remove the workspace owner');
    }

    // Get requester's role
    const requesterMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: requesterId,
        },
      },
    });

    // ADMINs can't remove other ADMINs (only OWNER can)
    if (
      requesterMembership?.role === Role.ADMIN &&
      membership.role === Role.ADMIN &&
      workspace.ownerId !== requesterId
    ) {
      throw new ForbiddenException('Only the owner can remove other admins');
    }

    await this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return {
      message: `${membership.user.fullName} has been removed from the workspace`,
    };
  }

  /**
   * Leave a workspace - Any member
   * Owner cannot leave (must transfer or delete)
   */
  async leave(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true, name: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId === userId) {
      throw new BadRequestException(
        'Owner cannot leave the workspace. Transfer ownership first or delete the workspace.',
      );
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new BadRequestException('You are not a member of this workspace');
    }

    await this.prisma.workspaceMember.delete({
      where: { id: membership.id },
    });

    return { message: `You have left ${workspace.name}` };
  }

  /**
   * Transfer ownership - OWNER only
   */
  async transferOwnership(
    workspaceId: string,
    currentOwnerId: string,
    dto: TransferOwnershipDto,
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true, name: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Verify current owner (guard should have checked, but double-check)
    if (workspace.ownerId !== currentOwnerId) {
      throw new ForbiddenException('Only the owner can transfer ownership');
    }

    // Can't transfer to self
    if (dto.newOwnerId === currentOwnerId) {
      throw new BadRequestException('You are already the owner');
    }

    // New owner must be an existing member
    const newOwnerMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: dto.newOwnerId,
        },
      },
      include: { user: { select: { fullName: true, email: true } } },
    });

    if (!newOwnerMembership) {
      throw new BadRequestException(
        'New owner must be an existing member of the workspace',
      );
    }

    // Transaction: Update workspace owner + update roles
    await this.prisma.$transaction([
      // Update workspace owner
      this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { ownerId: dto.newOwnerId },
      }),
      // New owner gets OWNER role
      this.prisma.workspaceMember.update({
        where: { id: newOwnerMembership.id },
        data: { role: Role.OWNER },
      }),
      // Previous owner becomes ADMIN
      this.prisma.workspaceMember.updateMany({
        where: {
          workspaceId,
          userId: currentOwnerId,
        },
        data: { role: Role.ADMIN },
      }),
    ]);

    return {
      message: `Ownership transferred to ${newOwnerMembership.user.fullName}`,
      newOwner: {
        id: dto.newOwnerId,
        name: newOwnerMembership.user.fullName,
        email: newOwnerMembership.user.email,
      },
    };
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }
}

