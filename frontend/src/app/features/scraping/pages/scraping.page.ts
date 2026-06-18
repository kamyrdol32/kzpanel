import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { JobSource, RemoteType } from '@evpanel/shared';
import { TranslateModule } from '@ngx-translate/core';

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

  /** Selected source drives which fields are shown. Empty = nothing yet. */
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

  ngOnInit(): void {
    this.facade.load();
  }

  onSourceChange(value: string): void {
    this.selectedSource.set(value as JobSource | '');
    // reset filter fields when the service changes
    this.form.patchValue({ query: '', location: '', remoteType: '' });
  }

  hasField(key: SourceField['key']): boolean {
    return this.fields().some((f) => f.key === key);
  }

  canAdd(): boolean {
    if (!this.selectedSource()) return false;
    return this.fields()
      .filter((f) => f.required)
      .every((f) => !!this.form.getRawValue()[f.key]?.toString().trim());
  }

  add(): void {
    if (!this.canAdd()) return;
    const v = this.form.getRawValue();
    this.facade.add({
      source: v.source as JobSource,
      query: v.query.trim(),
      location: this.hasField('location') && v.location.trim() ? v.location.trim() : undefined,
      remoteType: this.hasField('remoteType') && v.remoteType ? (v.remoteType as RemoteType) : undefined,
    });
    this.form.patchValue({ query: '', location: '', remoteType: '' });
  }
}
