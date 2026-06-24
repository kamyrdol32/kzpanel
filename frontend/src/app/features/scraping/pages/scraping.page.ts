import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { JobSource, RemoteType, ScrapeTargetDto } from '@kzpanel/shared';
import { TranslateModule } from '@ngx-translate/core';

import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { ScrapingFacade } from '../facade/scraping.facade';
import { SCRAPEABLE_SOURCES, SOURCE_FIELDS, SourceField } from '../source-fields';

@Component({
  selector: 'ev-scraping',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    ConfirmDialogComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    TranslateModule,
  ],
  templateUrl: './scraping.page.html',
  styleUrl: './scraping.page.scss',
})
export class ScrapingPage implements OnInit {
  protected readonly facade = inject(ScrapingFacade);
  private readonly fb = inject(FormBuilder);

  protected readonly sources = SCRAPEABLE_SOURCES;

  protected readonly selectedSource = signal<JobSource | ''>('');
  protected readonly fields = computed<SourceField[]>(() =>
    this.selectedSource() ? (SOURCE_FIELDS[this.selectedSource()] ?? []) : [],
  );

  protected readonly form = this.fb.nonNullable.group({
    source: ['' as JobSource | '', Validators.required],
    query: [''],
    location: [''],
    remoteType: ['' as RemoteType | ''],
  });

  /** Form value mirrored as a signal so `canAdd` can be a computed. */
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected readonly canAdd = computed(() => {
    if (!this.selectedSource()) {
      return false;
    }
    const value = this.formValue();
    return this.fields()
      .filter((f) => f.required)
      .every((f) => !!value[f.key]?.toString().trim());
  });

  // ── confirmation modals ───────────────────────────────────────────────
  protected readonly pendingDelete = signal<ScrapeTargetDto | null>(null);
  protected readonly pendingClear = signal<ScrapeTargetDto | null>(null);

  protected confirmDelete(): void {
    const t = this.pendingDelete();
    if (t) {
      this.facade.remove(t.id);
    }
    this.pendingDelete.set(null);
  }

  protected confirmClear(): void {
    const t = this.pendingClear();
    if (t) {
      this.facade.clearOffers(t.id);
    }
    this.pendingClear.set(null);
  }

  // ── inline edit ──────────────────────────────────────────────────────
  protected readonly editingId = signal<string | null>(null);
  protected readonly editFields = signal<SourceField[]>([]);

  protected readonly editForm = this.fb.nonNullable.group({
    query: ['', Validators.required],
    location: [''],
    remoteType: ['' as RemoteType | ''],
  });

  protected readonly editHasLocation = computed(() =>
    this.editFields().some((f) => f.key === 'location'),
  );
  protected readonly editHasRemote = computed(() =>
    this.editFields().some((f) => f.key === 'remoteType'),
  );
  protected readonly editRemoteOptions = computed(
    () => this.editFields().find((f) => f.key === 'remoteType')?.options ?? [],
  );

  public ngOnInit(): void {
    this.facade.load();
  }

  protected onSourceChange(value: string): void {
    this.selectedSource.set(value as JobSource | '');
    this.form.patchValue({ query: '', location: '', remoteType: '' });
  }

  private hasField(key: SourceField['key']): boolean {
    return this.fields().some((f) => f.key === key);
  }

  protected add(): void {
    if (!this.canAdd()) {
      return;
    }
    const v = this.form.getRawValue();
    this.facade.add({
      source: v.source as JobSource,
      query: v.query.trim(),
      location: this.hasField('location') && v.location.trim() ? v.location.trim() : undefined,
      remoteType: this.hasField('remoteType') && v.remoteType ? (v.remoteType as RemoteType) : undefined,
    });
    this.form.patchValue({ query: '', location: '', remoteType: '' });
  }

  protected startEdit(target: ScrapeTargetDto): void {
    this.editingId.set(target.id);
    const fields = SOURCE_FIELDS[target.source] ?? [];
    this.editFields.set(fields);
    this.editForm.patchValue({
      query: target.query,
      location: target.location ?? '',
      remoteType: (target.remoteType as RemoteType | undefined) ?? '',
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected saveEdit(id: string): void {
    const v = this.editForm.getRawValue();
    const hasLocation = this.editFields().some((f) => f.key === 'location');
    const hasRemote = this.editFields().some((f) => f.key === 'remoteType');

    this.facade.edit(id, {
      query: v.query.trim(),
      location: hasLocation && v.location.trim() ? v.location.trim() : undefined,
      remoteType: hasRemote && v.remoteType ? (v.remoteType as RemoteType) : undefined,
    });
    this.editingId.set(null);
  }
}
