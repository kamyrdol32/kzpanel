import { Injectable } from '@angular/core';

const ACCESS = 'ev-access-token';
const REFRESH = 'ev-refresh-token';

/** Thin wrapper around token persistence (swap to httpOnly cookies later). */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  get accessToken(): string | null {
    return localStorage.getItem(ACCESS);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH);
  }

  set(access: string, refresh: string): void {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  }

  clear(): void {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  }
}
