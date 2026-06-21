import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { EnvironmentInjector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { TokenStorageService } from '../auth/token-storage.service';

/**
 * Centralized HTTP error handling — logs out on 401.
 *
 * Router is resolved lazily (only when a 401 actually fires) via the injector.
 * Injecting Router eagerly here can form a cycle when an early request runs
 * while the Router is still being constructed (Router → TitleStrategy → HttpClient
 * → this interceptor → Router).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(EnvironmentInjector);
  const tokens = inject(TokenStorageService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        tokens.clear();
        void injector.get(Router).navigate(['/auth/login']);
      }
      return throwError(() => err);
    }),
  );
};
