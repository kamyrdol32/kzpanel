import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { JobFilter, JobLevel, JobOfferDto, Language, RemoteType, Role, ScrapeTargetDto } from '@kzpanel/shared';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { RecruitmentFacade } from '../../recruitment/facade/recruitment.facade';
import { ScrapingApi } from '../../scraping/data-access/scraping.api';
import { DataTableComponent, SortState, TableColumn } from '../../../shared/ui/data-table/data-table.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { GlobalSearchComponent } from '../../../shared/ui/global-search/global-search.component';
import { SkeletonLoaderComponent } from '../../../shared/ui/skeleton-loader/skeleton-loader.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { JobsFacade } from '../facade/jobs.facade';
import { JobSortField } from '../store/jobs.actions';

type JobRow = JobOfferDto & { applied: boolean; extraTech: string[] };


@Component({
  selector: 'kz-jobs-list',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    DataTableComponent,
    EmptyStateComponent,
    GlobalSearchComponent,
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
  private readonly scrapingApi = inject(ScrapingApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  private pendingScraperId: string | null = null;

  protected readonly PAGE_SIZE = 100;

  protected readonly scrapers = signal<ScrapeTargetDto[]>([]);
  protected readonly otherScrapers = signal<ScrapeTargetDto[]>([]);
  protected readonly selectedScraper = signal<ScrapeTargetDto | null>(null);
  protected readonly scrapersLoading = signal(false);
  protected readonly isAdmin = computed(() => this.auth.user()?.role === Role.ADMIN);

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
    if (current > 3) {
      pages.push(-1);
    }
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
      pages.push(p);
    }

    if (current < total - 2) {
      pages.push(-1);
    }
    pages.push(total);
    return pages;
  });
  protected readonly paginatedJobs = computed<JobRow[]>(() => {
    const page = this.currentPage();
    const applied = this.appliedJobIds();
    return this.facade
      .jobs()
      .slice((page - 1) * this.PAGE_SIZE, page * this.PAGE_SIZE)
      .map((job) => ({
        ...job,
        applied: applied.has(job.id),
        extraTech: this.extraTech(job),
      }));
  });

  protected readonly levels = Object.values(JobLevel);
  protected readonly remoteTypes = Object.values(RemoteType);
  protected readonly languages = Object.values(Language);

  protected readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    level: ['' as JobLevel | ''],
    remoteType: ['' as RemoteType | ''],
    language: ['' as Language | ''],
  });

  protected readonly activeFilters = signal(false);

  protected readonly appliedJobIds = computed<Set<string>>(() => {
    const set = new Set<string>();
    for (const r of this.recruitmentFacade.items()) {
      if (r.jobOfferId) {
        set.add(r.jobOfferId);
      }
    }
    return set;
  });

  protected columns: TableColumn<JobRow>[] = [];

  private extraTech(job: JobOfferDto): string[] {
    const must = new Set((job.mustHave ?? []).map((m) => m.toLowerCase()));
    return (job.techStack ?? []).filter((t) => !must.has(t.toLowerCase()));
  }

  private translateEnum(values: string[] | undefined, group: string): string | null {
    if (!values?.length) {
      return null;
    }
    return values.map((v) => this.t.instant(`enum.${group}.${v}`)).join(', ');
  }

  protected readonly trackById = (job: JobRow): string => job.id;

  protected readonly rowClass = (job: JobRow): string => {
    const classes: string[] = [];
    if (job.dismissed) {
      classes.push('job-row-dismissed');
    }

    if (job.staleAt) {
      classes.push('job-row-stale');
    }

    if (this.appliedJobIds().has(job.id)) {
      classes.push('job-row-applied');
    }
    return classes.join(' ');
  };

  public ngOnInit(): void {
    this.columns = [
      { key: 'title', label: this.t.instant('jobs.col.title'), sortKey: 'title' },
      { key: 'company', label: this.t.instant('jobs.col.company'), sortKey: 'company' },
      {
        key: 'salary',
        label: this.t.instant('jobs.col.salary'),
        sortKey: 'salaryMin',
        value: (j) => (j.salaryMin ? `${j.salaryMin}–${j.salaryMax ?? ''} ${j.currency ?? ''}` : null),
      },
      { key: 'location', label: this.t.instant('jobs.col.location'), sortKey: 'location' },
      {
        key: 'employmentTypes',
        label: this.t.instant('jobs.col.employmentType'),
        value: (j) => this.translateEnum(j.employmentTypes, 'employment'),
      },
      {
        key: 'remoteTypes',
        label: this.t.instant('jobs.col.remoteType'),
        sortKey: 'remoteTypes',
        value: (j) => this.translateEnum(j.remoteTypes, 'remote'),
      },
      {
        key: 'levels',
        label: this.t.instant('jobs.col.level'),
        value: (j) => this.translateEnum(j.levels, 'level'),
      },
    ];

    this.recruitmentFacade.load();
    this.loadScrapers();

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('scraper');
      if (!id) {
        this.selectedScraper.set(null);
        this.pendingScraperId = null;
        return;
      }

      if (this.selectedScraper()?.id === id) {
        return;
      }
      const found = [...this.scrapers(), ...this.otherScrapers()].find((s) => s.id === id);
      if (found) {
        this.applyScraper(found);
      } else {
        this.pendingScraperId = id;
      }
    });

    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((v) => {
        const scraper = this.selectedScraper();
        if (!scraper) {
          return;
        }
        const filter: JobFilter = { scrapeTargetId: scraper.id };
        if (v.search?.trim()) {
          filter.search = v.search.trim();
        }

        if (v.level) {
          filter.level = v.level as JobLevel;
        }

        if (v.remoteType) {
          filter.remoteType = v.remoteType as RemoteType;
        }

        if (v.language) {
          filter.language = v.language as Language;
        }
        this.activeFilters.set(!!(v.search || v.level || v.remoteType || v.language));
        this.currentPage.set(1);
        this.facade.setFilter(filter);
      });
  }

  private loadScrapers(): void {
    this.scrapersLoading.set(true);
    this.scrapingApi.list().subscribe({
      next: (rows) => {
        this.scrapers.set(rows);
        this.resolvePending();
      },
      complete: () => this.scrapersLoading.set(false),
    });
    if (this.isAdmin()) {
      this.scrapingApi.listOthers().subscribe({
        next: (rows) => {
          this.otherScrapers.set(rows);
          this.resolvePending();
        },
      });
    }
  }

  private resolvePending(): void {
    if (!this.pendingScraperId) {
      return;
    }
    const found = [...this.scrapers(), ...this.otherScrapers()].find((s) => s.id === this.pendingScraperId);
    if (found) {
      this.pendingScraperId = null;
      this.applyScraper(found);
    }
  }

  private applyScraper(scraper: ScrapeTargetDto): void {
    this.selectedScraper.set(scraper);
    this.expandedId.set(null);
    this.currentPage.set(1);
    this.clearFilters();
    this.facade.setFilter({ scrapeTargetId: scraper.id });
  }

  protected selectScraper(scraper: ScrapeTargetDto): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { scraper: scraper.id } });
  }

  protected backToScrapers(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected toggleRow(job: JobOfferDto): void {
    this.expandedId.update((id) => (id === job.id ? null : job.id));
  }

  private isApplied(job: JobOfferDto): boolean {
    return this.appliedJobIds().has(job.id);
  }

  protected onSortChange(state: SortState): void {
    this.currentPage.set(1);
    this.facade.setSort(state.key as JobSortField, state.dir);
  }

  protected goToPage(page: number): void {
    this.currentPage.set(page);
    this.expandedId.set(null);
  }

  protected clearFilters(): void {
    this.filterForm.reset({ search: '', level: '', remoteType: '', language: '' });
    this.activeFilters.set(false);
  }

  protected apply(job: JobOfferDto): void {
    window.open(job.sourceUrl, '_blank', 'noopener,noreferrer');
    if (!this.isApplied(job)) {
      this.recruitmentFacade.applyToOffer(job).subscribe();
    }
  }

  protected openSource(job: JobOfferDto): void {
    window.open(job.sourceUrl, '_blank', 'noopener,noreferrer');
  }

  protected toggleDismissed(job: JobOfferDto): void {
    this.facade.setDismissed(job.id, !job.dismissed);
  }

  protected remove(id: string): void {
    if (this.expandedId() === id) {
      this.expandedId.set(null);
    }
    this.facade.remove(id);
  }
}
