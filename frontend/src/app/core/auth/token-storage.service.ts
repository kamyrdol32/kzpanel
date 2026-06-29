import { Injectable, signal } from '@angular/core';

const ACCESS = 'kz-access-token';
const REFRESH = 'kz-refresh-token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  // Signal-backed so dependents (AuthService.isAuthenticated) react to
  // login/logout. Reading localStorage directly inside a computed would create
  // a dependency-less computed that caches its first value forever.
  private readonly _accessToken = signal<string | null>(localStorage.getItem(ACCESS));
  public readonly accessToken = this._accessToken.asReadonly();

  public getAccessToken(): string | null {
    return this._accessToken();
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH);
  }

  public set(access: string, refresh: string): void {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
    this._accessToken.set(access);
  }

  public setAccess(access: string): void {
    localStorage.setItem(ACCESS, access);
    this._accessToken.set(access);
  }

  public clear(): void {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    this._accessToken.set(null);
  }
}
