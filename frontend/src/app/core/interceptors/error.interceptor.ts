import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { TokenStorageService } from '../auth/token-storage.service';

/** Centralized HTTP error handling — logs out on 401. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokens = inject(TokenStorageService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        tokens.clear();
        void router.navigate(['/auth/login']);
      }
      return throwError(() => err);
    }),
  );
};
