import { Injectable } from '@angular/core';

const ACCESS = 'ev-access-token';
const REFRESH = 'ev-refresh-token';

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

  public setAccess(access: string): void {
    localStorage.setItem(ACCESS, access);
  }

  public clear(): void {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  }
}
