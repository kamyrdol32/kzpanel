import { inject, Injectable } from '@angular/core';
import { AdminUserDto, SetUserActiveRequest, SetUserPermissionsRequest, SetUserRoleRequest } from '@kzpanel/shared';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/http/api.service';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly api = inject(ApiService);

  public list(): Observable<AdminUserDto[]> {
    return this.api.get<AdminUserDto[]>('/users');
  }

  public setActive(id: string, body: SetUserActiveRequest): Observable<AdminUserDto> {
    return this.api.patch<AdminUserDto>(`/users/${id}/active`, body);
  }

  public setRole(id: string, body: SetUserRoleRequest): Observable<AdminUserDto> {
    return this.api.patch<AdminUserDto>(`/users/${id}/role`, body);
  }

  public setPermissions(id: string, body: SetUserPermissionsRequest): Observable<AdminUserDto> {
    return this.api.patch<AdminUserDto>(`/users/${id}/permissions`, body);
  }

  public remove(id: string): Observable<void> {
    return this.api.delete<void>(`/users/${id}`);
  }
}
