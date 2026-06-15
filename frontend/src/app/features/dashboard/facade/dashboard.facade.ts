import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DashboardStatsDto, ServiceDto } from '@evpanel/shared';
import { combineLatest, map, shareReplay, startWith, Subject, switchMap, timer } from 'rxjs';

import { DashboardApi } from '../data-access/dashboard.api';

const REFRESH_MS = 15_000;

/**
 * Facade is the ONLY surface the dashboard page talks to. It exposes signals and
 * auto-refreshes monitoring data every 15s using timer + switchMap (no nested subs).
 */
@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly api = inject(DashboardApi);
  private readonly manualRefresh = new Subject<void>();

  private readonly tick$ = this.manualRefresh.pipe(
    startWith(void 0),
    switchMap(() => timer(0, REFRESH_MS)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly data$ = this.tick$.pipe(
    switchMap(() =>
      combineLatest({
        stats: this.api.getStats(),
        services: this.api.getServices(),
      }),
    ),
    takeUntilDestroyed(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly stats = toSignal(this.data$.pipe(map((d): DashboardStatsDto | null => d.stats)), {
    initialValue: null,
  });
  readonly services = toSignal(this.data$.pipe(map((d) => d.services)), {
    initialValue: [] as ServiceDto[],
  });

  refresh(): void {
    this.manualRefresh.next();
  }
}
