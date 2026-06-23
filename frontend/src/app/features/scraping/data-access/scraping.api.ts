import { inject, Injectable } from '@angular/core';
import {
  CreateScrapeTargetRequest,
  ScrapeRunResult,
  ScrapeTargetDto,
  UpdateScrapeTargetRequest,
} from '@evpanel/shared';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/http/api.service';

@Injectable({ providedIn: 'root' })
export class ScrapingApi {
  private readonly api = inject(ApiService);

  list(): Observable<ScrapeTargetDto[]> {
    return this.api.get<ScrapeTargetDto[]>('/scrape-targets');
  }

  /** Admin-only: scrapers owned by other accounts. */
  listOthers(): Observable<ScrapeTargetDto[]> {
    return this.api.get<ScrapeTargetDto[]>('/scrape-targets/others');
  }

  create(body: CreateScrapeTargetRequest): Observable<ScrapeTargetDto> {
    return this.api.post<ScrapeTargetDto>('/scrape-targets', body);
  }

  update(id: string, body: UpdateScrapeTargetRequest): Observable<ScrapeTargetDto> {
    return this.api.patch<ScrapeTargetDto>(`/scrape-targets/${id}`, body);
  }

  clearOffers(id: string): Observable<{ deleted: number }> {
    return this.api.delete<{ deleted: number }>(`/scrape-targets/${id}/offers`);
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`/scrape-targets/${id}`);
  }

  runAll(): Observable<ScrapeRunResult> {
    return this.api.post<ScrapeRunResult>('/scrape-targets/run', {});
  }

  runOne(id: string): Observable<ScrapeRunResult> {
    return this.api.post<ScrapeRunResult>(`/scrape-targets/${id}/run`, {});
  }
}
