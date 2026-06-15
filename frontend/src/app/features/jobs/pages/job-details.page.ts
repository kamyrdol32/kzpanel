import { Component, inject, input, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { CardComponent } from '../../../shared/ui/card/card.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { JobsFacade } from '../facade/jobs.facade';

@Component({
  selector: 'ev-job-details',
  standalone: true,
  imports: [CardComponent, StatusBadgeComponent, TranslateModule],
  templateUrl: './job-details.page.html',
})
export class JobDetailsPage implements OnInit {
  /** bound from the route param via withComponentInputBinding() */
  readonly id = input.required<string>();
  protected readonly facade = inject(JobsFacade);

  ngOnInit(): void {
    this.facade.open(this.id());
  }
}
