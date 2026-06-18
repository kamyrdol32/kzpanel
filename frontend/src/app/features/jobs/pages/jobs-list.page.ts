import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { JobFilter, JobLevel, JobOfferDto, JobSource, Language, RemoteType } from '@evpanel/shared';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

import { RecruitmentFacade } from '../../recruitment/facade/recruitment.facade';
import { DataTableComponent, SortState, TableColumn } from '../../../shared/ui/data-table/data-table.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/ui/skeleton-loader/skeleton-loader.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { JobsFacade } from '../facade/jobs.facade';
import { JobSortField } from '../store/jobs.actions';


@Component({
  selector: 'ev-jobs-list',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    DataTableComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    StatusBadgeComponent,
    TranslateModule,
  ],
  templateUrl: './jobs-list.page.html',
  styleUrl: './jobs-list.page.scss',
})
export class JobsListPage implements OnInit, OnDestroy {
  protected readonly facade = inject(JobsFacade);
  protected readonly recruitmentFacade = inject(RecruitmentFacade);
  private readonly fb = inject(FormBuilder);
  private readonly t = inject(TranslateService);
  private readonly destroy$ = new Subject<void>();

  protected readonly PAGE_SIZE = 100;

  protected readonly expandedId = signal<string | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.facade.jobs().length / this.PAGE_SIZE)));

  protected readonly pageNumbers = computed<(number | -1)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | -1)[] = [1];
    if (current > 3) pages.push(-1);
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
      pages.push(p);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  });
  protected readonly paginatedJobs = computed(() => {
    const page = this.currentPage();
    return this.facade.jobs().slice((page - 1) * this.PAGE_SIZE, page * this.PAGE_SIZE);
  });

  protected readonly sources = Object.values(JobSource).filter((s) => s !== JobSource.MANUAL);
  protected readonly levels = Object.values(JobLevel);
  protected readonly remoteTypes = Object.values(RemoteType);
  protected readonly languages = Object.values(Language);

  protected readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    source: ['' as JobSource | ''],
    level: ['' as JobLevel | ''],
    remoteType: ['' as RemoteType | ''],
    language: ['' as Language | ''],
  });

  protected readonly activeFilters = signal(false);

  protected readonly appliedJobIds = computed<Set<string>>(() => {
    const set = new Set<string>();
    for (const r of this.recruitmentFacade.items()) {
      if (r.jobOfferId) set.add(r.jobOfferId);
    }
    return set;
  });

  protected readonly columns: TableColumn<JobOfferDto>[] = [
    { key: 'title', label: this.t.instant('jobs.col.title'), sortKey: 'title' },
    { key: 'company', label: this.t.instant('jobs.col.company'), sortKey: 'company' },
    {
      key: 'salary',
      label: this.t.instant('jobs.col.salary'),
      sortKey: 'salaryMin',
      value: (j) => (j.salaryMin ? `${j.salaryMin}–${j.salaryMax ?? ''} ${j.currency ?? ''}` : null),
    },
    { key: 'location', label: this.t.instant('jobs.col.location') },
    { key: 'remoteType', label: this.t.instant('jobs.col.remoteType') },
    { key: 'publishedDate', label: this.t.instant('jobs.col.publishedDate'), sortKey: 'publishedDate' },
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

    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((v) => {
        const filter: JobFilter = {};
        if (v.search?.trim()) filter.search = v.search.trim();
        if (v.source) filter.source = v.source as JobSource;
        if (v.level) filter.level = v.level as JobLevel;
        if (v.remoteType) filter.remoteType = v.remoteType as RemoteType;
        if (v.language) filter.language = v.language as Language;
        this.activeFilters.set(!!(v.search || v.source || v.level || v.remoteType || v.language));
        this.currentPage.set(1);
        this.facade.setFilter(filter);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleRow(job: JobOfferDto): void {
    this.expandedId.update((id) => (id === job.id ? null : job.id));
  }

  isApplied(job: JobOfferDto): boolean {
    return this.appliedJobIds().has(job.id);
  }

  onSortChange(state: SortState): void {
    this.currentPage.set(1);
    this.facade.setSort(state.key as JobSortField, state.dir);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.expandedId.set(null);
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', source: '', level: '', remoteType: '', language: '' });
    this.activeFilters.set(false);
  }

  apply(job: JobOfferDto): void {
    window.open(job.sourceUrl, '_blank', 'noopener,noreferrer');
    if (!this.isApplied(job)) {
      this.recruitmentFacade.applyToOffer(job).subscribe();
    }
  }

  toggleDismissed(job: JobOfferDto): void {
    this.facade.setDismissed(job.id, !job.dismissed);
  }

  remove(id: string): void {
    if (this.expandedId() === id) this.expandedId.set(null);
    this.facade.remove(id);
  }
}
