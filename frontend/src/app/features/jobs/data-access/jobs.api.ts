import { inject, Injectable } from '@angular/core';
import { JobFilter, JobOfferDto, UpdateJobRequest } from '@evpanel/shared';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/http/api.service';

@Injectable({ providedIn: 'root' })
export class JobsApi {
  private readonly api = inject(ApiService);

  public list(filter: JobFilter): Observable<JobOfferDto[]> {
    return this.api.get<JobOfferDto[]>('/jobs', { ...filter });
  }

  public getOne(id: string): Observable<JobOfferDto> {
    return this.api.get<JobOfferDto>(`/jobs/${id}`);
  }

  public update(id: string, patch: UpdateJobRequest): Observable<JobOfferDto> {
    return this.api.patch<JobOfferDto>(`/jobs/${id}`, patch);
  }

  public remove(id: string): Observable<void> {
    return this.api.delete<void>(`/jobs/${id}`);
  }
}
