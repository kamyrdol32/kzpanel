import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { JobSource, RemoteType, ScrapeTargetDto } from '@evpanel/shared';
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

  // ── confirmation modals ───────────────────────────────────────────────
  protected readonly pendingDelete = signal<ScrapeTargetDto | null>(null);
  protected readonly pendingClear = signal<ScrapeTargetDto | null>(null);

  confirmDelete(): void {
    const t = this.pendingDelete();
    if (t) {
      this.facade.remove(t.id);
    }
    this.pendingDelete.set(null);
  }

  confirmClear(): void {
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

  ngOnInit(): void {
    this.facade.load();
  }

  onSourceChange(value: string): void {
    this.selectedSource.set(value as JobSource | '');
    this.form.patchValue({ query: '', location: '', remoteType: '' });
  }

  hasField(key: SourceField['key']): boolean {
    return this.fields().some((f) => f.key === key);
  }

  canAdd(): boolean {
    if (!this.selectedSource()) {
      return false;
    }
    return this.fields()
      .filter((f) => f.required)
      .every((f) => !!this.form.getRawValue()[f.key]?.toString().trim());
  }

  add(): void {
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

  startEdit(target: ScrapeTargetDto): void {
    this.editingId.set(target.id);
    const fields = SOURCE_FIELDS[target.source] ?? [];
    this.editFields.set(fields);
    this.editForm.patchValue({
      query: target.query,
      location: target.location ?? '',
      remoteType: (target.remoteType as RemoteType | undefined) ?? '',
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(id: string): void {
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

  hasEditField(key: SourceField['key']): boolean {
    return this.editFields().some((f) => f.key === key);
  }

  getEditField(key: SourceField['key']): SourceField | undefined {
    return this.editFields().find((f) => f.key === key);
  }
}
