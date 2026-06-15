import { Role } from '@evpanel/shared';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Restrict a route/controller to the given roles (used with RolesGuard). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
