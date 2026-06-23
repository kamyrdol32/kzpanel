import { Injectable } from '@angular/core';

const ACCESS = 'ev-access-token';
const REFRESH = 'ev-refresh-token';

/** Thin wrapper around token persistence (swap to httpOnly cookies later). */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH);
  }

  set(access: string, refresh: string): void {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  }

  /** Replace just the access token (sliding-session renewal). */
  setAccess(access: string): void {
    localStorage.setItem(ACCESS, access);
  }

  clear(): void {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  }
}
