import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { WorkspaceRoleGuard } from '../guards/workspace-role.guard';

export const WORKSPACE_ROLES_KEY = 'workspace_roles';

/**
 * Decorator to specify required workspace roles for a route.
 * Automatically applies the WorkspaceRoleGuard.
 * 
 * Role hierarchy: OWNER > ADMIN > DEVELOPER > VIEWER
 * 
 * Usage: 
 *   @WorkspaceRoles(Role.OWNER)           // Only OWNER
 *   @WorkspaceRoles(Role.ADMIN)           // OWNER or ADMIN
 *   @WorkspaceRoles(Role.DEVELOPER)       // OWNER, ADMIN, or DEVELOPER
 *   @WorkspaceRoles(Role.VIEWER)          // Any member (read-only access)
 * 
 * Note: The workspaceId must be in route params as :workspaceId
 */
export const WorkspaceRoles = (...roles: Role[]) =>
  applyDecorators(
    SetMetadata(WORKSPACE_ROLES_KEY, roles),
    UseGuards(WorkspaceRoleGuard),
  );

/**
 * Helper decorators for common use cases
 */
export const OwnerOnly = () => WorkspaceRoles(Role.OWNER);
export const AdminOnly = () => WorkspaceRoles(Role.OWNER, Role.ADMIN);
export const DeveloperAccess = () => WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.DEVELOPER);
export const MemberAccess = () => WorkspaceRoles(Role.OWNER, Role.ADMIN, Role.DEVELOPER, Role.VIEWER);

