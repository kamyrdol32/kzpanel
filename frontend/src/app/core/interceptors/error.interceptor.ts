import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { EnvironmentInjector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { ToastService } from '../toast/toast.service';

/**
 * Centralized HTTP error handling — ends the session on an expired/invalid token.
 *
 * Only non-auth requests are treated as a session expiry; auth endpoints (login,
 * refresh, change-password) return 401 for their own reasons and are handled by
 * their components. The token presence check makes this fire once even if several
 * requests fail at the same time.
 *
 * Services are resolved lazily (only when a 401 actually fires) via the injector
 * to avoid a construction cycle (Router → TitleStrategy → HttpClient → this
 * interceptor → Router).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(EnvironmentInjector);
  const tokens = inject(TokenStorageService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const sessionExpired = err.status === 401 && !req.url.includes('/auth/') && !!tokens.getAccessToken();
      if (sessionExpired) {
        injector.get(AuthService).clearSession();
        injector.get(ToastService).warning(injector.get(TranslateService).instant('auth.sessionExpired'));
        void injector.get(Router).navigate(['/auth/login']);
      }
      return throwError(() => err);
    }),
  );
};
