import { inject, Injectable } from '@angular/core';
import { DashboardStatsDto, ServiceDto } from '@evpanel/shared';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/http/api.service';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly api = inject(ApiService);

  getStats(): Observable<DashboardStatsDto> {
    return this.api.get<DashboardStatsDto>('/monitoring/stats');
  }

  getServices(): Observable<ServiceDto[]> {
    return this.api.get<ServiceDto[]>('/monitoring/services');
  }
}
