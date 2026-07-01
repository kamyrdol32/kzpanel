import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { EnvironmentInjector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthTokens } from '@kzpanel/shared';
import { catchError, finalize, Observable, shareReplay, switchMap, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { ToastService } from '../toast/toast.service';

/**
 * On a 401 for a non-auth request, first try to silently refresh the access
 * token (e.g. it expired overnight while a refresh token is still valid) and
 * replay the request. Only if the refresh itself fails — or there is no refresh
 * token — is the session ended with a notice.
 *
 * Auth endpoints handle their own 401s. The shared refresh observable dedupes
 * concurrent failures so the rotating refresh token is used exactly once, and
 * the ALREADY_RETRIED flag stops an endless retry loop.
 *
 * Services are resolved lazily via the injector to avoid a construction cycle
 * (Router → TitleStrategy → HttpClient → this interceptor → Router).
 */
const ALREADY_RETRIED = new HttpContextToken<boolean>(() => false);
let refresh$: Observable<AuthTokens> | null = null;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(EnvironmentInjector);
  const tokens = inject(TokenStorageService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthCall = req.url.includes('/auth/');
      if (err.status !== 401 || isAuthCall) {
        return throwError(() => err);
      }

      const canRefresh = !!tokens.getRefreshToken() && !req.context.get(ALREADY_RETRIED);
      if (!canRefresh) {
        if (tokens.getAccessToken()) {
          endSession(injector);
        }
        return throwError(() => err);
      }

      const auth = injector.get(AuthService);
      if (!refresh$) {
        refresh$ = auth.refresh().pipe(
          finalize(() => {
            refresh$ = null;
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
      }

      return refresh$.pipe(
        catchError((refreshErr) => {
          endSession(injector);
          return throwError(() => refreshErr);
        }),
        switchMap(() => {
          auth.syncFromToken();
          const retried = req.clone({
            context: req.context.set(ALREADY_RETRIED, true),
            setHeaders: { Authorization: `Bearer ${tokens.getAccessToken()}` },
          });
          return next(retried);
        }),
      );
    }),
  );
};

function endSession(injector: EnvironmentInjector): void {
  injector.get(AuthService).clearSession();
  injector.get(ToastService).warning(injector.get(TranslateService).instant('auth.sessionExpired'));
  void injector.get(Router).navigate(['/auth/login']);
}
