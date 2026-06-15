import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { TokenStorageService } from '../auth/token-storage.service';

/** Attaches the bearer access token to outgoing API requests. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenStorageService);
  const token = tokens.accessToken;
  if (token && req.url.includes('/api')) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};
