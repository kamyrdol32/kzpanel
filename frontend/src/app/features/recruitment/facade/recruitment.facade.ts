import { inject, Injectable, signal } from '@angular/core';
import {
  CreateRecruitmentRequest,
  JobOfferDto,
  RecruitmentDto,
  RecruitmentStatus,
} from '@evpanel/shared';
import { Observable, tap } from 'rxjs';

import { ApiService } from '../../../core/http/api.service';

@Injectable({ providedIn: 'root' })
export class RecruitmentFacade {
  private readonly api = inject(ApiService);

  readonly items = signal<RecruitmentDto[]>([]);
  readonly loading = signal(false);

  load(): void {
    this.loading.set(true);
    this.api.get<RecruitmentDto[]>('/recruitment').subscribe({
      next: (rows) => {
        this.items.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /**
   * Records that a CV was sent for a given job offer — creates a recruitment
   * entry with status CV_SENT, prefilled from the offer.
   */
  applyToOffer(job: JobOfferDto): Observable<RecruitmentDto> {
    const payload: CreateRecruitmentRequest = {
      company: job.company,
      position: job.title,
      level: job.level,
      workMode: job.remoteType,
      salaryMin: job.salaryMin ?? undefined,
      salaryMax: job.salaryMax ?? undefined,
      currency: job.currency ?? undefined,
      appliedAt: new Date().toISOString(),
      status: RecruitmentStatus.CV_SENT,
      jobOfferId: job.id,
    };
    return this.api
      .post<RecruitmentDto>('/recruitment', payload)
      .pipe(tap((created) => this.items.update((list) => [created, ...list])));
  }

  updateStatus(id: string, status: RecruitmentStatus): void {
    this.api.patch<RecruitmentDto>(`/recruitment/${id}`, { status }).subscribe({
      next: (updated) =>
        this.items.update((list) => list.map((r) => (r.id === id ? updated : r))),
    });
  }

  remove(id: string): void {
    this.api.delete<void>(`/recruitment/${id}`).subscribe({
      next: () => this.items.update((list) => list.filter((r) => r.id !== id)),
    });
  }
}
