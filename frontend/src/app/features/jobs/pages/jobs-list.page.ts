import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { JobOfferDto } from '@evpanel/shared';
import { TranslateModule } from '@ngx-translate/core';

import { RecruitmentFacade } from '../../recruitment/facade/recruitment.facade';
import { DataTableComponent, TableColumn } from '../../../shared/ui/data-table/data-table.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/ui/skeleton-loader/skeleton-loader.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { JobsFacade } from '../facade/jobs.facade';

@Component({
  selector: 'ev-jobs-list',
  standalone: true,
  imports: [
    DatePipe,
    DataTableComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    StatusBadgeComponent,
    TranslateModule,
  ],
  templateUrl: './jobs-list.page.html',
  styleUrl: './jobs-list.page.scss',
})
export class JobsListPage implements OnInit {
  protected readonly facade = inject(JobsFacade);
  protected readonly recruitmentFacade = inject(RecruitmentFacade);

  protected readonly expandedId = signal<string | null>(null);

  /** Set of jobOfferIds that already have a CV sent */
  protected readonly appliedJobIds = computed<Set<string>>(() => {
    const set = new Set<string>();
    for (const r of this.recruitmentFacade.items()) {
      if (r.jobOfferId) set.add(r.jobOfferId);
    }
    return set;
  });

  protected readonly columns: TableColumn<JobOfferDto>[] = [
    { key: 'title', label: 'Stanowisko' },
    { key: 'company', label: 'Firma' },
    {
      key: 'salary',
      label: 'Wynagrodzenie',
      value: (j) => (j.salaryMin ? `${j.salaryMin}–${j.salaryMax ?? ''} ${j.currency ?? ''}` : null),
    },
    { key: 'location', label: 'Lokalizacja' },
    { key: 'remoteType', label: 'Tryb pracy' },
  ];

  protected readonly trackById = (job: JobOfferDto): string => job.id;

  protected readonly rowClass = (job: JobOfferDto): string => {
    const classes: string[] = [];
    if (job.dismissed) classes.push('job-row-dismissed');
    if (this.appliedJobIds().has(job.id)) classes.push('job-row-applied');
    return classes.join(' ');
  };

  ngOnInit(): void {
    this.facade.load();
    this.recruitmentFacade.load();
  }

  toggleRow(job: JobOfferDto): void {
    this.expandedId.update((id) => (id === job.id ? null : job.id));
  }

  isApplied(job: JobOfferDto): boolean {
    return this.appliedJobIds().has(job.id);
  }

  /** Open the offer in a new tab and record that a CV was sent. */
  apply(job: JobOfferDto): void {
    window.open(job.sourceUrl, '_blank', 'noopener,noreferrer');
    if (!this.isApplied(job)) {
      this.recruitmentFacade.applyToOffer(job).subscribe();
    }
  }

  /** Toggle "reviewed & not interesting" flag on the offer. */
  toggleDismissed(job: JobOfferDto): void {
    this.facade.setDismissed(job.id, !job.dismissed);
  }

  remove(id: string): void {
    if (this.expandedId() === id) this.expandedId.set(null);
    this.facade.remove(id);
  }
}
