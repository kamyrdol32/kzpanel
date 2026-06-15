import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import {
  AuthTokens,
  AuthUser,
  LoginResponse,
  RegisterRequest,
} from '@evpanel/shared';
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
  readonly isAuthenticated = computed(() => !!this.tokens.accessToken);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, { email, password }).pipe(
      tap((res) => {
        this.tokens.set(res.accessToken, res.refreshToken);
        this._user.set(res.user);
      }),
    );
  }

  register(body: RegisterRequest): Observable<{ activationToken: string }> {
    return this.http.post<{ activationToken: string }>(`${this.base}/register`, body);
  }

  refresh(): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${this.base}/refresh`, { refreshToken: this.tokens.refreshToken })
      .pipe(tap((res) => this.tokens.set(res.accessToken, res.refreshToken)));
  }

  logout(): void {
    this.http.post(`${this.base}/logout`, {}).subscribe({ error: () => void 0 });
    this.tokens.clear();
    this._user.set(null);
  }
}
