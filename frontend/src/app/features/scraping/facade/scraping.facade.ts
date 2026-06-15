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
    this.api
      .runAll()
      .pipe(finalize(() => this.running.set(false)))
      .subscribe({
        next: (r) => {
          this.lastResult.set(`targets: ${r.targetsProcessed}, oferty: ${r.offersUpserted}`);
          this.load();
        },
      });
  }

  runOne(id: string): void {
    this.running.set(true);
    this.api
      .runOne(id)
      .pipe(finalize(() => this.running.set(false)))
      .subscribe({
        next: (r) => {
          this.lastResult.set(`oferty: ${r.offersUpserted}`);
          this.load();
        },
      });
  }
}
