import { inject, Injectable, signal } from '@angular/core';
import {
  CreateRecruitmentRequest,
  JobLevel,
  JobOfferDto,
  RecruitmentDto,
  RecruitmentStatus,
  RemoteType,
} from '@kzpanel/shared';
import { TranslateService } from '@ngx-translate/core';
import { Observable, tap } from 'rxjs';

import { ApiService } from '../../../core/http/api.service';
import { ToastService } from '../../../core/toast/toast.service';

@Injectable({ providedIn: 'root' })
export class RecruitmentFacade {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly items = signal<RecruitmentDto[]>([]);
  readonly loading = signal(false);

  public load(): void {
    this.loading.set(true);
    this.api.get<RecruitmentDto[]>('/recruitment').subscribe({
      next: (rows) => {
        this.items.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error(this.translate.instant('common.errorGeneric'));
      },
    });
  }

  public applyToOffer(job: JobOfferDto): Observable<RecruitmentDto> {
    const payload: CreateRecruitmentRequest = {
      company: job.company,
      position: job.title,
      level: job.levels?.[0] ?? JobLevel.MID,
      workMode: job.remoteTypes?.[0] ?? RemoteType.REMOTE,
      salaryMin: job.salaryMin ?? undefined,
      salaryMax: job.salaryMax ?? undefined,
      currency: job.currency ?? undefined,
      appliedAt: new Date().toISOString(),
      status: RecruitmentStatus.CV_SENT,
      jobOfferId: job.id,
    };
    return this.api
      .post<RecruitmentDto>('/recruitment', payload)
      .pipe(tap((created) => {
        this.items.update((list) => [created, ...list]);
        this.toast.success(this.translate.instant('recruitment.toastApplied', { company: job.company }));
      }));
  }

  public updateStatus(id: string, status: RecruitmentStatus): void {
    this.api.patch<RecruitmentDto>(`/recruitment/${id}`, { status }).subscribe({
      next: (updated) => {
        this.items.update((list) => list.map((r) => (r.id === id ? updated : r)));
        const statusLabel = this.translate.instant(`enum.status.${updated.status}`);
        this.toast.info(this.translate.instant('recruitment.toastStatusChanged', { status: statusLabel }));
      },
      error: () => this.toast.error(this.translate.instant('common.errorGeneric')),
    });
  }

  public remove(id: string): void {
    this.api.delete<void>(`/recruitment/${id}`).subscribe({
      next: () => {
        this.items.update((list) => list.filter((r) => r.id !== id));
        this.toast.info(this.translate.instant('recruitment.toastRemoved'));
      },
      error: () => this.toast.error(this.translate.instant('common.errorGeneric')),
    });
  }
}
