import { inject, Injectable, signal } from '@angular/core';
import { CreateScrapeTargetRequest, ScrapeTargetDto } from '@evpanel/shared';
import { finalize } from 'rxjs';

import { ScrapingApi } from '../data-access/scraping.api';

/** Single interaction surface for the scraping panel (signal-based facade). */
@Injectable({ providedIn: 'root' })
export class ScrapingFacade {
  private readonly api = inject(ScrapingApi);

  readonly targets = signal<ScrapeTargetDto[]>([]);
  readonly loading = signal(false);
  readonly running = signal(false);
  /** id targetu który aktualnie się scrape'uje, null = runAll lub brak */
  readonly runningId = signal<string | null>(null);
  readonly lastResult = signal<string | null>(null);

  load(): void {
    this.loading.set(true);
    this.api
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (rows) => this.targets.set(rows) });
  }

  add(body: CreateScrapeTargetRequest): void {
    this.api.create(body).subscribe({ next: () => this.load() });
  }

  remove(id: string): void {
    this.api.remove(id).subscribe({ next: () => this.load() });
  }

  runAll(): void {
    this.running.set(true);
    this.runningId.set(null);
    this.lastResult.set(null);
    this.api
      .runAll()
      .pipe(finalize(() => { this.running.set(false); this.runningId.set(null); }))
      .subscribe({
        next: (r) => {
          this.lastResult.set(`Cele: ${r.targetsProcessed}, oferty: ${r.offersUpserted}`);
          this.load();
        },
        error: (err) => {
          this.lastResult.set(`Błąd: ${(err as { message?: string }).message ?? 'nieznany'}`);
        },
      });
  }

  runOne(id: string): void {
    this.running.set(true);
    this.runningId.set(id);
    this.lastResult.set(null);
    this.api
      .runOne(id)
      .pipe(finalize(() => { this.running.set(false); this.runningId.set(null); }))
      .subscribe({
        next: (r) => {
          this.lastResult.set(`oferty: ${r.offersUpserted}`);
          this.load();
        },
        error: (err) => {
          this.lastResult.set(`Błąd: ${(err as { message?: string }).message ?? 'nieznany'}`);
        },
      });
  }
}
