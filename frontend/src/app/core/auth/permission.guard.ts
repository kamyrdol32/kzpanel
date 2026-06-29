import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Permission } from '@kzpanel/shared';

import { AuthService } from './auth.service';

export const permissionGuard = (...permissions: Permission[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const allowed = permissions.some((p) => auth.hasPermission(p));
    return allowed ? true : router.createUrlTree(['/forbidden']);
  };
