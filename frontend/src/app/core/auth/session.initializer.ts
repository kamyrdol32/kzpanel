import { inject } from '@angular/core';
import { catchError, firstValueFrom, map, of, tap } from 'rxjs';

import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

/**
 * Runs before the app renders. If the access token is still valid, nothing to
 * do. If it has expired (e.g. after a night idle) but a refresh token is still
 * good, silently get a fresh access token so the user never sees a logged-in
 * shell with no data. Otherwise clear the stale session so the app starts on
 * the landing/login screen.
 */
export function resumeSession(): Promise<void> {
  const auth = inject(AuthService);
  const tokens = inject(TokenStorageService);

  if (auth.hasValidAccessToken()) {
    auth.syncFromToken();
    return Promise.resolve();
  }

  if (!tokens.getRefreshToken()) {
    auth.clearSession();
    return Promise.resolve();
  }

  return firstValueFrom(
    auth.refresh().pipe(
      tap(() => auth.syncFromToken()),
      map(() => undefined),
      catchError(() => {
        auth.clearSession();
        return of(undefined);
      }),
    ),
  );
}
