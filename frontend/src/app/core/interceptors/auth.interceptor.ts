import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';

import { TokenStorageService } from '../auth/token-storage.service';

/**
 * Attaches the bearer access token to outgoing API requests and captures the
 * rolling `x-access-token` the backend returns on every authenticated response
 * (sliding session) — swapping it in keeps an active user logged in.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenStorageService);
  const token = tokens.accessToken;
  const outgoing =
    token && req.url.includes('/api')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(outgoing).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const renewed = event.headers.get('x-access-token');
        if (renewed) {
          tokens.setAccess(renewed);
        }
      }
    }),
  );
};
