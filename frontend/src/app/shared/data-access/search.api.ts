import { inject, Injectable } from '@angular/core';
import { JobOfferDto, RecruitmentDto } from '@kzpanel/shared';
import { Observable } from 'rxjs';

import { ApiService } from '../../core/http/api.service';

export interface SearchResultsDto {
  jobs: JobOfferDto[];
  recruitments: RecruitmentDto[];
}

@Injectable({ providedIn: 'root' })
export class SearchApi {
  private readonly api = inject(ApiService);

  public search(q: string): Observable<SearchResultsDto> {
    return this.api.get<SearchResultsDto>('/search', { q });
  }
}
