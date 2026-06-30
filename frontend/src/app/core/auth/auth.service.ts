import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import {
  AuthTokens,
  AuthUser,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  JwtPayload,
  LoginResponse,
  Permission,
  RegisterRequest,
  ResetPasswordRequest,
  Role,
} from '@kzpanel/shared';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenStorageService);
  private readonly base = `${environment.apiUrl}/auth`;

  private readonly _user = signal<AuthUser | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokens.getAccessToken());

  constructor() {
    this._user.set(this.userFromToken());
  }

  private userFromToken(): AuthUser | null {
    const token = this.tokens.getAccessToken();
    if (!token) {
      return null;
    }
    try {
      const part = token.split('.')[1];
      const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(decodeURIComponent(escape(json))) as JwtPayload & { exp?: number };
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return null;
      }
      return {
        id: payload.sub,
        username: payload.username,
        role: payload.role ?? Role.USER,
        email: null,
        isActive: true,
        permissions: payload.permissions ?? [],
      };
    } catch {
      return null;
    }
  }

  public login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, { username, password }).pipe(
      tap((res) => {
        this.tokens.set(res.accessToken, res.refreshToken);
        this._user.set(res.user);
      }),
    );
  }

  public register(body: RegisterRequest): Observable<{ activationToken?: string }> {
    return this.http.post<{ activationToken?: string }>(`${this.base}/register`, body);
  }

  public forgotPassword(body: ForgotPasswordRequest): Observable<{ resetToken?: string }> {
    return this.http.post<{ resetToken?: string }>(`${this.base}/forgot-password`, body);
  }

  public resetPassword(body: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/reset-password`, body);
  }

  public changePassword(body: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/change-password`, body);
  }

  public refresh(): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${this.base}/refresh`, { refreshToken: this.tokens.getRefreshToken() })
      .pipe(tap((res) => this.tokens.set(res.accessToken, res.refreshToken)));
  }

  // Re-derive role and permissions from the current (renewed) access token so an
  // admin's change reaches the live session without a re-login. Email and other
  // fields from the original login response are preserved.
  public syncFromToken(): void {
    const fromToken = this.userFromToken();
    if (!fromToken) {
      return;
    }
    const current = this._user();
    if (!current) {
      this._user.set(fromToken);
      return;
    }
    this._user.set({ ...current, role: fromToken.role, permissions: fromToken.permissions });
  }

  public hasPermission(permission: Permission): boolean {
    const user = this._user();
    if (!user) {
      return false;
    }
    if (user.role === Role.ADMIN) {
      return true;
    }
    return user.permissions.includes(permission);
  }

  public logout(): void {
    this.http.post(`${this.base}/logout`, {}).subscribe({ error: () => void 0 });
    this.clearSession();
  }

  // Drops local auth state without calling the backend — used when the session
  // has already become invalid (e.g. an expired token returned 401).
  public clearSession(): void {
    this.tokens.clear();
    this._user.set(null);
  }
}
