import { Component, inject } from '@angular/core';
import { ServiceStatus } from '@evpanel/shared';
import { TranslateModule } from '@ngx-translate/core';

import { MetricWidgetComponent } from '../../../shared/ui/metric-widget/metric-widget.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { DashboardFacade } from '../facade/dashboard.facade';

@Component({
  selector: 'ev-dashboard',
  standalone: true,
  imports: [MetricWidgetComponent, StatusBadgeComponent, TranslateModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  protected readonly facade = inject(DashboardFacade);
  protected readonly ServiceStatus = ServiceStatus;

  tone(status: ServiceStatus): 'success' | 'danger' | 'neutral' {
    if (status === ServiceStatus.ONLINE) return 'success';
    if (status === ServiceStatus.OFFLINE) return 'danger';
    return 'neutral';
  }
}
