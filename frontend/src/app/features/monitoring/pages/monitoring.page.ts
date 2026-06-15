import { Component, inject } from '@angular/core';
import { ServiceStatus } from '@evpanel/shared';
import { TranslateModule } from '@ngx-translate/core';

import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { DashboardFacade } from '../../dashboard/facade/dashboard.facade';

@Component({
  selector: 'ev-monitoring',
  standalone: true,
  imports: [StatusBadgeComponent, TranslateModule],
  template: `
    <div class="ev-page">
      <h1 class="ev-page__title">{{ 'nav.monitoring' | translate }}</h1>
      <div class="grid">
        @for (svc of facade.services(); track svc.id) {
          <div class="row">
            <span>{{ svc.name }}</span>
            <ev-status-badge [label]="svc.status" [tone]="tone(svc.status)" />
            <span class="muted">{{ svc.responseTime ?? '—' }} ms · CPU {{ svc.cpu ?? '—' }}% · RAM {{ svc.ram ?? '—' }}%</span>
          </div>
        } @empty {
          <p class="muted">{{ 'dashboard.noServices' | translate }}</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .grid { display: flex; flex-direction: column; gap: 8px; }
      .row {
        display: grid;
        grid-template-columns: 200px 120px 1fr;
        align-items: center;
        gap: 16px;
        padding: 12px 16px;
        background: var(--ev-surface);
        border: 1px solid var(--ev-border);
        border-radius: 12px;
      }
      .muted { color: var(--ev-text-muted); font-size: 13px; }
    `,
  ],
})
export class MonitoringPage {
  // Reuses the dashboard facade — same auto-refreshing services stream.
  protected readonly facade = inject(DashboardFacade);

  tone(status: ServiceStatus): 'success' | 'danger' | 'neutral' {
    if (status === ServiceStatus.ONLINE) return 'success';
    if (status === ServiceStatus.OFFLINE) return 'danger';
    return 'neutral';
  }
}
