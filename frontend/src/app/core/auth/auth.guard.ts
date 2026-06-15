import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/** Blocks protected routes when no valid access token is present. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/auth/login']);
};
