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

  public list(): Observable<ScrapeTargetDto[]> {
    return this.api.get<ScrapeTargetDto[]>('/scrape-targets');
  }

  /** Admin-only: scrapers owned by other accounts. */
  public listOthers(): Observable<ScrapeTargetDto[]> {
    return this.api.get<ScrapeTargetDto[]>('/scrape-targets/others');
  }

  public create(body: CreateScrapeTargetRequest): Observable<ScrapeTargetDto> {
    return this.api.post<ScrapeTargetDto>('/scrape-targets', body);
  }

  public update(id: string, body: UpdateScrapeTargetRequest): Observable<ScrapeTargetDto> {
    return this.api.patch<ScrapeTargetDto>(`/scrape-targets/${id}`, body);
  }

  public clearOffers(id: string): Observable<{ deleted: number }> {
    return this.api.delete<{ deleted: number }>(`/scrape-targets/${id}/offers`);
  }

  public remove(id: string): Observable<void> {
    return this.api.delete<void>(`/scrape-targets/${id}`);
  }

  public runAll(): Observable<ScrapeRunResult> {
    return this.api.post<ScrapeRunResult>('/scrape-targets/run', {});
  }

  public runOne(id: string): Observable<ScrapeRunResult> {
    return this.api.post<ScrapeRunResult>(`/scrape-targets/${id}/run`, {});
  }
}
