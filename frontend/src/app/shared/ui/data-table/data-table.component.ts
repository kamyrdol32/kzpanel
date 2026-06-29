import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, contentChild, input, output, TemplateRef } from '@angular/core';

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  /** optional value accessor for computed/nested cells */
  value?: (row: T) => string | number | null;
  /** if set, clicking this header emits sortChange with this key */
  sortKey?: string;
}

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

@Component({
  selector: 'kz-data-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            @if (rowPrefix()) {
              <th class="table-prefix-col"></th>
            }
            @for (col of columns(); track col.key) {
              <th
                [class.th-sortable]="!!col.sortKey"
                [class.th-sort-active]="col.sortKey && col.sortKey === activeSort()?.key"
                (click)="col.sortKey && onHeaderClick(col.sortKey)"
              >
                <span class="th-inner">
                  {{ col.label }}
                  @if (col.sortKey && col.sortKey === activeSort()?.key) {
                    <span class="material-symbols-rounded th-sort-icon">
                      {{ activeSort()!.dir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                    </span>
                  } @else if (col.sortKey) {
                    <span class="material-symbols-rounded th-sort-icon th-sort-icon-idle">unfold_more</span>
                  }
                </span>
              </th>
            }
            @if (actions()) {
              <th class="table-actions-col"></th>
            }
          </tr>
        </thead>
        <tbody>
          @for (dr of displayRows(); track dr.id) {
            <tr
              [class]="dr.cls"
              [class.table-row-clickable]="!!clickable()"
              [class.table-row-selected]="dr.id === selectedId()"
              (click)="clickable() && rowClick.emit(dr.raw)"
            >
              @if (rowPrefix(); as prefTpl) {
                <td class="table-prefix" (click)="$event.stopPropagation()">
                  <ng-container [ngTemplateOutlet]="prefTpl" [ngTemplateOutletContext]="{ $implicit: dr.raw }" />
                </td>
              }
              @for (c of dr.cells; track c.key) {
                <td><span class="cell" [title]="c.value">{{ c.value }}</span></td>
              }
              @if (actions(); as tpl) {
                <td class="table-actions" (click)="$event.stopPropagation()">
                  <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{ $implicit: dr.raw }" />
                </td>
              }
            </tr>
            @if (expanded(); as expTpl) {
              @if (dr.id === selectedId()) {
                <tr class="table-row-expanded">
                  <td [attr.colspan]="columns().length + (actions() ? 1 : 0) + (rowPrefix() ? 1 : 0)">
                    <ng-container [ngTemplateOutlet]="expTpl" [ngTemplateOutletContext]="{ $implicit: dr.raw }" />
                  </td>
                </tr>
              }
            }
          }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T> {
  readonly columns = input.required<TableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly trackBy = input<(row: T) => unknown>(() => (row: T) => row);
  readonly selectedId = input<unknown>(null);
  readonly clickable = input(false);
  readonly rowClass = input<(row: T) => string>(() => '');
  readonly activeSort = input<SortState | null>(null);

  readonly rowClick = output<T>();
  readonly sortChange = output<SortState>();

  readonly rowPrefix = contentChild<TemplateRef<{ $implicit: T }>>('rowPrefix');
  readonly actions = contentChild<TemplateRef<{ $implicit: T }>>('actions');
  readonly expanded = contentChild<TemplateRef<{ $implicit: T }>>('expanded');

  /** Pre-rendered rows so the template reads data instead of calling methods. */
  protected readonly displayRows = computed(() => {
    const cols = this.columns();
    const trackBy = this.trackBy();
    const rowClass = this.rowClass();
    return this.rows().map((row) => ({
      raw: row,
      id: trackBy(row),
      cls: rowClass(row),
      cells: cols.map((col) => ({ key: col.key, value: this.cell(row, col) })),
    }));
  });

  protected onHeaderClick(key: string): void {
    const current = this.activeSort();
    const dir: 'asc' | 'desc' =
      current?.key === key
        ? current.dir === 'desc' ? 'asc' : 'desc'
        : 'desc';
    this.sortChange.emit({ key, dir });
  }

  private cell(row: T, col: TableColumn<T>): string | number {
    const raw = col.value ? col.value(row) : (row as Record<string, unknown>)[col.key as string];
    return raw == null ? '—' : (raw as string | number);
  }
}
