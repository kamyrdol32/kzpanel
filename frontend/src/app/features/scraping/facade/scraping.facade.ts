import { computed, inject, Injectable, signal } from '@angular/core';
import {
  CreateScrapeScheduleRequest,
  CreateScrapeTargetRequest,
  Permission,
  Role,
  ScrapeTargetDto,
  UpdateScrapeScheduleRequest,
  UpdateScrapeTargetRequest,
} from '@kzpanel/shared';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/toast/toast.service';
import { WebSocketService } from '../../../core/websocket/websocket.service';
import { ScrapingApi } from '../data-access/scraping.api';

@Injectable({ providedIn: 'root' })
export class ScrapingFacade {
  private readonly api = inject(ScrapingApi);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly ws = inject(WebSocketService);

  readonly targets = signal<ScrapeTargetDto[]>([]);
  readonly otherTargets = signal<ScrapeTargetDto[]>([]);
  readonly isAdmin = computed(() => this.auth.user()?.role === Role.ADMIN);
  readonly canRun = computed(() => this.auth.hasPermission(Permission.SCRAPE_RUN));
  readonly canManageTargets = computed(() => this.auth.hasPermission(Permission.SCRAPE_TARGETS_MANAGE));
  readonly canManageSchedules = computed(() => this.auth.hasPermission(Permission.SCRAPE_SCHEDULE_MANAGE));
  readonly loading = signal(false);
  readonly running = signal(false);
  readonly runningId = signal<string | null>(null);
  readonly lastResult = signal<string | null>(null);

  constructor() {
    this.ws.scrapeCompleted$.subscribe((r) => {
      if (!this.running()) {
        return;
      }
      const wasRunningId = this.runningId();
      this.running.set(false);
      this.runningId.set(null);
      this.lastResult.set(
        wasRunningId
          ? this.translate.instant('scraping.resultOffers', { offers: r.offersUpserted })
          : this.translate.instant('scraping.resultSummary', { targets: r.targetsProcessed, offers: r.offersUpserted }),
      );
      this.load();
    });
  }

  public load(): void {
    this.loading.set(true);
    this.api
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (rows) => this.targets.set(rows) });

    if (this.isAdmin()) {
      this.api.listOthers().subscribe({ next: (rows) => this.otherTargets.set(rows) });
    }
  }

  public add(body: CreateScrapeTargetRequest): void {
    this.api.create(body).subscribe({
      next: () => {
        this.load();
        this.toast.success(this.translate.instant('scraping.toastAdded'));
      },
      error: () => this.toast.error(this.translate.instant('common.errorGeneric')),
    });
  }

  public edit(id: string, body: UpdateScrapeTargetRequest): void {
    this.api.update(id, body).subscribe({
      next: () => {
        this.load();
        this.toast.success(this.translate.instant('scraping.toastUpdated'));
      },
      error: () => this.toast.error(this.translate.instant('common.errorGeneric')),
    });
  }

  public clearOffers(id: string): void {
    this.api.clearOffers(id).subscribe({
      next: () => {
        this.load();
        this.toast.info(this.translate.instant('scraping.toastCleared'));
      },
      error: () => this.toast.error(this.translate.instant('common.errorGeneric')),
    });
  }

  public remove(id: string): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.load();
        this.toast.info(this.translate.instant('scraping.toastRemoved'));
      },
      error: () => this.toast.error(this.translate.instant('common.errorGeneric')),
    });
  }

  public runAll(): void {
    this.running.set(true);
    this.runningId.set(null);
    this.lastResult.set(null);
    this.api.runAll().subscribe({
      error: () => {
        this.running.set(false);
        this.toast.error(this.translate.instant('scraping.toastRunError'));
      },
    });
  }

  public runOne(id: string): void {
    this.running.set(true);
    this.runningId.set(id);
    this.lastResult.set(null);
    this.api.runOne(id).subscribe({
      error: () => {
        this.running.set(false);
        this.runningId.set(null);
        this.toast.error(this.translate.instant('scraping.toastRunError'));
      },
    });
  }

  public addSchedule(targetId: string, body: CreateScrapeScheduleRequest): void {
    this.api.createSchedule(targetId, body).subscribe({
      next: () => {
        this.load();
        this.toast.success(this.translate.instant('scraping.toastScheduleAdded'));
      },
      error: () => this.toast.error(this.translate.instant('common.errorGeneric')),
    });
  }

  public editSchedule(targetId: string, id: string, body: UpdateScrapeScheduleRequest): void {
    this.api.updateSchedule(targetId, id, body).subscribe({
      next: () => {
        this.load();
        this.toast.success(this.translate.instant('scraping.toastScheduleUpdated'));
      },
      error: () => this.toast.error(this.translate.instant('common.errorGeneric')),
    });
  }

  public removeSchedule(targetId: string, id: string): void {
    this.api.deleteSchedule(targetId, id).subscribe({
      next: () => {
        this.load();
        this.toast.info(this.translate.instant('scraping.toastScheduleRemoved'));
      },
      error: () => this.toast.error(this.translate.instant('common.errorGeneric')),
    });
  }
}
