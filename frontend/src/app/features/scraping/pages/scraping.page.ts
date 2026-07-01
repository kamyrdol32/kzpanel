import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  JobSource,
  RecurrenceType,
  RemoteType,
  ScrapeScheduleDto,
  ScrapeTargetDto,
} from '@kzpanel/shared';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';

import { WeekdayLabelPipe } from '../../../shared/pipes/weekday-label.pipe';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { PL_CITIES } from '../cities';
import { ScrapingFacade } from '../facade/scraping.facade';
import { SCRAPEABLE_SOURCES, SOURCE_FIELDS, SourceField } from '../source-fields';

@Component({
  selector: 'kz-scraping',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    ConfirmDialogComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    TranslateModule,
    NgSelectModule,
    WeekdayLabelPipe,
  ],
  templateUrl: './scraping.page.html',
  styleUrl: './scraping.page.scss',
})
export class ScrapingPage implements OnInit {
  protected readonly facade = inject(ScrapingFacade);
  private readonly fb = inject(FormBuilder);

  protected readonly sources = SCRAPEABLE_SOURCES;
  protected readonly cities = PL_CITIES;

  protected readonly addOpen = signal(false);
  protected readonly targetsOpen = signal(true);
  protected readonly othersOpen = signal(false);

  protected toggleAdd(): void {
    this.addOpen.update((v) => !v);
  }

  protected toggleTargets(): void {
    this.targetsOpen.update((v) => !v);
  }

  protected toggleOthers(): void {
    this.othersOpen.update((v) => !v);
  }

  protected readonly selectedSource = signal<JobSource | ''>('');
  protected readonly fields = computed<SourceField[]>(() =>
    this.selectedSource() ? (SOURCE_FIELDS[this.selectedSource()] ?? []) : [],
  );

  protected readonly form = this.fb.nonNullable.group({
    source: ['' as JobSource | '', Validators.required],
    query: [''],
    location: [''],
    remoteType: ['' as RemoteType | ''],
    includeAllRemote: [false],
  });

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

  protected readonly editingId = signal<string | null>(null);
  protected readonly editFields = signal<SourceField[]>([]);

  protected readonly editForm = this.fb.nonNullable.group({
    query: ['', Validators.required],
    location: [''],
    remoteType: ['' as RemoteType | ''],
    includeAllRemote: [false],
  });

  protected readonly editHasLocation = computed(() =>
    this.editFields().some((f) => f.key === 'location'),
  );
  protected readonly editHasRemote = computed(() =>
    this.editFields().some((f) => f.key === 'remoteType'),
  );
  protected readonly editHasIncludeAllRemote = computed(() =>
    this.editFields().some((f) => f.key === 'includeAllRemote'),
  );
  protected readonly editRemoteOptions = computed(
    () => this.editFields().find((f) => f.key === 'remoteType')?.options ?? [],
  );

  public ngOnInit(): void {
    this.facade.load();
  }

  protected onSourceChange(value: string): void {
    this.selectedSource.set(value as JobSource | '');
    this.form.patchValue({ query: '', location: '', remoteType: '', includeAllRemote: false });
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
      includeAllRemote: this.hasField('includeAllRemote') ? v.includeAllRemote : undefined,
    });
    this.form.patchValue({ query: '', location: '', remoteType: '', includeAllRemote: false });
  }

  protected startEdit(target: ScrapeTargetDto): void {
    this.editingId.set(target.id);
    const fields = SOURCE_FIELDS[target.source] ?? [];
    this.editFields.set(fields);
    this.editForm.patchValue({
      query: target.query,
      location: target.location ?? '',
      remoteType: (target.remoteType as RemoteType | undefined) ?? '',
      includeAllRemote: target.includeAllRemote ?? false,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected saveEdit(id: string): void {
    const v = this.editForm.getRawValue();
    const hasLocation = this.editFields().some((f) => f.key === 'location');
    const hasRemote = this.editFields().some((f) => f.key === 'remoteType');

    const hasIncludeAllRemote = this.editFields().some((f) => f.key === 'includeAllRemote');
    this.facade.edit(id, {
      query: v.query.trim(),
      location: hasLocation && v.location.trim() ? v.location.trim() : undefined,
      remoteType: hasRemote && v.remoteType ? (v.remoteType as RemoteType) : undefined,
      includeAllRemote: hasIncludeAllRemote ? v.includeAllRemote : undefined,
    });
    this.editingId.set(null);
  }

  protected readonly recurrenceTypes: RecurrenceType[] = [
    RecurrenceType.DAILY,
    RecurrenceType.WEEKLY,
    RecurrenceType.MONTHLY,
  ];

  protected readonly weekdayOptions: { value: number; labelKey: string }[] = [
    { value: 1, labelKey: 'scraping.weekdayMon' },
    { value: 2, labelKey: 'scraping.weekdayTue' },
    { value: 3, labelKey: 'scraping.weekdayWed' },
    { value: 4, labelKey: 'scraping.weekdayThu' },
    { value: 5, labelKey: 'scraping.weekdayFri' },
    { value: 6, labelKey: 'scraping.weekdaySat' },
    { value: 0, labelKey: 'scraping.weekdaySun' },
  ];

  protected readonly dayOfMonthOptions: number[] = Array.from({ length: 31 }, (_, i) => i + 1);

  protected readonly expandedScheduleTargetId = signal<string | null>(null);

  protected readonly scheduleForm = this.fb.nonNullable.group({
    recurrenceType: [RecurrenceType.DAILY, Validators.required],
    time: ['08:00', Validators.required],
    daysOfWeek: [[] as number[]],
    dayOfMonth: [1],
  });

  private readonly scheduleFormValue = toSignal(this.scheduleForm.valueChanges, {
    initialValue: this.scheduleForm.getRawValue(),
  });

  protected readonly scheduleFormShowsWeekly = computed(
    () => this.scheduleFormValue().recurrenceType === RecurrenceType.WEEKLY,
  );

  protected readonly scheduleFormShowsMonthly = computed(
    () => this.scheduleFormValue().recurrenceType === RecurrenceType.MONTHLY,
  );

  protected readonly weekdayPickerOptions = computed(() => {
    const selected = this.scheduleFormValue().daysOfWeek ?? [];
    return this.weekdayOptions.map((opt) => ({ ...opt, selected: selected.includes(opt.value) }));
  });

  protected toggleScheduleEditor(targetId: string): void {
    if (this.expandedScheduleTargetId() === targetId) {
      this.expandedScheduleTargetId.set(null);
      return;
    }
    this.expandedScheduleTargetId.set(targetId);
    this.scheduleForm.reset({ recurrenceType: RecurrenceType.DAILY, time: '08:00', daysOfWeek: [], dayOfMonth: 1 });
  }

  protected toggleWeekday(day: number): void {
    const current = this.scheduleForm.controls.daysOfWeek.value;
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    this.scheduleForm.controls.daysOfWeek.setValue(next);
  }

  protected addSchedule(targetId: string): void {
    if (this.scheduleForm.invalid) {
      return;
    }
    const v = this.scheduleForm.getRawValue();
    this.facade.addSchedule(targetId, {
      recurrenceType: v.recurrenceType,
      time: v.time,
      daysOfWeek: v.recurrenceType === RecurrenceType.WEEKLY ? v.daysOfWeek : undefined,
      dayOfMonth: v.recurrenceType === RecurrenceType.MONTHLY ? v.dayOfMonth : undefined,
    });
    this.scheduleForm.patchValue({ time: '08:00', daysOfWeek: [], dayOfMonth: 1 });
  }

  protected removeSchedule(targetId: string, scheduleId: string): void {
    this.facade.removeSchedule(targetId, scheduleId);
  }

  protected toggleScheduleEnabled(schedule: ScrapeScheduleDto): void {
    this.facade.editSchedule(schedule.scrapeTargetId, schedule.id, { enabled: !schedule.enabled });
  }
}
