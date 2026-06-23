import { Injectable } from '@angular/core';

const ACCESS = 'ev-access-token';
const REFRESH = 'ev-refresh-token';

/** Thin wrapper around token persistence (swap to httpOnly cookies later). */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  public getAccessToken(): string | null {
    return localStorage.getItem(ACCESS);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH);
  }

  public set(access: string, refresh: string): void {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  }

  /** Replace just the access token (sliding-session renewal). */
  public setAccess(access: string): void {
    localStorage.setItem(ACCESS, access);
  }

  public clear(): void {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  }
}
