import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Permission } from '@kzpanel/shared';

import { AuthService } from './auth.service';

/**
 * Public landing route guard. Unauthenticated visitors see the landing page;
 * authenticated users are forwarded to the first section they can open
 * (settings as a guaranteed fallback), which also avoids the redirect loop a
 * static landing-to-feature redirect would cause for limited accounts.
 */
export const landingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  if (auth.hasPermission(Permission.JOBS_VIEW)) {
    return router.createUrlTree(['/jobs']);
  }

  if (auth.hasPermission(Permission.RECRUITMENT_MANAGE)) {
    return router.createUrlTree(['/recruitment']);
  }

  if (auth.hasPermission(Permission.SCRAPE_RUN) || auth.hasPermission(Permission.SCRAPE_TARGETS_MANAGE)) {
    return router.createUrlTree(['/scraping']);
  }

  return router.createUrlTree(['/settings']);
};
