import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JobOfferDto, RecruitmentDto } from '@evpanel/shared';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

import { SearchApi, SearchResultsDto } from '../../data-access/search.api';

@Component({
  selector: 'ev-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './global-search.component.html',
  styleUrl: './global-search.component.scss',
})
export class GlobalSearchComponent {
  private readonly api = inject(SearchApi);
  private readonly router = inject(Router);

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  protected query = '';
  protected results: SearchResultsDto | null = null;
  protected loading = false;
  protected open = false;

  private readonly query$ = new Subject<string>();

  constructor() {
    this.query$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          if (q.length < 2) {
            this.results = null;
            this.loading = false;
            return [];
          }
          this.loading = true;
          return this.api.search(q);
        }),
      )
      .subscribe({
        next: (res) => {
          this.results = res as SearchResultsDto;
          this.loading = false;
          this.open = true;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  protected onInput(): void {
    this.query$.next(this.query);
    if (this.query.length < 2) {
      this.results = null;
      this.open = false;
    }
  }

  protected get hasResults(): boolean {
    return (this.results?.jobs.length ?? 0) > 0 || (this.results?.recruitments.length ?? 0) > 0;
  }

  protected openJob(job: JobOfferDto): void {
    void this.router.navigate(['/jobs'], { queryParams: { scrapeTargetId: job.scrapeTargetId } });
    this.close();
  }

  protected openRecruitment(): void {
    void this.router.navigate(['/recruitment']);
    this.close();
  }

  protected close(): void {
    this.open = false;
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (!(event.target as HTMLElement).closest('ev-global-search')) {
      this.close();
    }
  }
}
