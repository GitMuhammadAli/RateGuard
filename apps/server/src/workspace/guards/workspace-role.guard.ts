import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { WORKSPACE_ROLES_KEY } from '../decorators/workspace-roles.decorator';

/**
 * Guard that checks if the current user has the required role in a workspace.
 * 
 * Key concept: Permission checking before every action!
 * 
 * How it works:
 * 1. Gets workspaceId from route params
 * 2. Gets userId from authenticated user
 * 3. Checks if workspace exists
 * 4. Checks if user is owner OR has membership with required role
 */
@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      WORKSPACE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles specified, allow access (public workspace route)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceId = request.params.workspaceId;

    // Must be authenticated
    if (!user || !user.id) {
      throw new ForbiddenException('Authentication required');
    }

    // Must have workspaceId in route
    if (!workspaceId) {
      throw new ForbiddenException('Workspace ID is required');
    }

    // Check if workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId, deletedAt: null },
      select: { id: true, ownerId: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // If user is the owner, they have OWNER role (highest privilege)
    if (workspace.ownerId === user.id) {
      // Attach workspace and role to request for use in controllers
      request.workspace = workspace;
      request.workspaceRole = Role.OWNER;
      return requiredRoles.includes(Role.OWNER);
    }

    // Check membership for non-owners
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
      select: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Attach workspace and role to request
    request.workspace = workspace;
    request.workspaceRole = membership.role;

    // Check if user's role is in the required roles
    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `This action requires one of these roles: ${requiredRoles.join(', ')}. ` +
        `Your role is: ${membership.role}`,
      );
    }

    return true;
  }
}

