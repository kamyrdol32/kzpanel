import { DatePipe } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { JobLevel, RecruitmentDto, RecruitmentStatus, RemoteType } from '@kzpanel/shared';
import { TranslateModule } from '@ngx-translate/core';

import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { GlobalSearchComponent } from '../../../shared/ui/global-search/global-search.component';
import { RecruitmentFacade } from '../facade/recruitment.facade';

@Component({
  selector: 'kz-recruitment',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    EmptyStateComponent,
    ConfirmDialogComponent,
    GlobalSearchComponent,
    TranslateModule,
  ],
  templateUrl: './recruitment.page.html',
  styleUrl: './recruitment.page.scss',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, maxHeight: '0px', overflow: 'hidden' }),
        animate('220ms ease-out', style({ opacity: 1, maxHeight: '400px' })),
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ opacity: 0, maxHeight: '0px', overflow: 'hidden' })),
      ]),
    ]),
  ],
})
export class RecruitmentPage implements OnInit {
  protected readonly facade = inject(RecruitmentFacade);
  private readonly fb = inject(FormBuilder);

  protected readonly statuses = Object.values(RecruitmentStatus);
  protected readonly levels = Object.values(JobLevel);
  protected readonly workModes = Object.values(RemoteType);

  protected readonly expandedId = signal<string | null>(null);
  protected readonly pendingDelete = signal<RecruitmentDto | null>(null);

  protected readonly filterSearch = signal('');
  protected readonly filterLevel = signal('');
  protected readonly filterStatus = signal('');
  protected readonly filterWorkMode = signal('');

  protected readonly filteredItems = computed(() => {
    const search = this.filterSearch().toLowerCase().trim();
    const level = this.filterLevel();
    const status = this.filterStatus();
    const workMode = this.filterWorkMode();

    return this.facade.items().filter((r) => {
      const matchesSearch =
        !search ||
        r.company.toLowerCase().includes(search) ||
        r.position.toLowerCase().includes(search);

      const matchesLevel = !level || r.level === level;
      const matchesStatus = !status || r.status === status;
      const matchesWorkMode = !workMode || r.workMode === workMode;

      return matchesSearch && matchesLevel && matchesStatus && matchesWorkMode;
    });
  });

  protected readonly activeFilters = computed(
    () =>
      !!this.filterSearch() ||
      !!this.filterLevel() ||
      !!this.filterStatus() ||
      !!this.filterWorkMode(),
  );

  protected readonly rows = computed(() => {
    const expandedId = this.expandedId();
    return this.filteredItems().map((item) => ({
      ...item,
      expanded: item.id === expandedId,
      toneClass: this.tone(item.status),
    }));
  });

  public ngOnInit(): void {
    this.facade.load();
  }

  protected toggleRow(id: string): void {
    this.expandedId.update((cur) => (cur === id ? null : id));
  }

  protected onStatusChange(id: string, value: string): void {
    this.facade.updateStatus(id, value as RecruitmentStatus);
  }

  protected askDelete(item: RecruitmentDto): void {
    this.pendingDelete.set(item);
  }

  protected confirmDelete(): void {
    const item = this.pendingDelete();
    if (item) {
      this.facade.remove(item.id);
    }
    this.pendingDelete.set(null);
  }

  protected clearFilters(): void {
    this.filterSearch.set('');
    this.filterLevel.set('');
    this.filterStatus.set('');
    this.filterWorkMode.set('');
  }

  private tone(status: RecruitmentStatus): string {
    switch (status) {
      case RecruitmentStatus.HIRED:
      case RecruitmentStatus.OFFER:
        return 'success';
      case RecruitmentStatus.REJECTED:
        return 'danger';
      case RecruitmentStatus.INTERVIEW:
      case RecruitmentStatus.TECHNICAL:
        return 'warning';
      default:
        return 'neutral';
    }
  }
}
