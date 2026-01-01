import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Decorator to specify required roles for a route
 * Usage: @Roles('owner', 'admin')
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

