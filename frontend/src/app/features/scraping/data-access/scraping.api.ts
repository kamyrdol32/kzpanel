import { inject, Injectable } from '@angular/core';
import {
  CreateScrapeTargetRequest,
  ScrapeRunResult,
  ScrapeTargetDto,
} from '@evpanel/shared';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/http/api.service';

@Injectable({ providedIn: 'root' })
export class ScrapingApi {
  private readonly api = inject(ApiService);

  list(): Observable<ScrapeTargetDto[]> {
    return this.api.get<ScrapeTargetDto[]>('/scrape-targets');
  }

  create(body: CreateScrapeTargetRequest): Observable<ScrapeTargetDto> {
    return this.api.post<ScrapeTargetDto>('/scrape-targets', body);
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
