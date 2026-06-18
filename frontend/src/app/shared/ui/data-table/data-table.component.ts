import { NgTemplateOutlet } from '@angular/common';
import { Component, contentChild, input, output, TemplateRef } from '@angular/core';

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
  selector: 'ev-data-table',
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
          @for (row of rows(); track trackBy()(row)) {
            <tr
              [class]="rowClass()(row)"
              [class.table-row-clickable]="!!clickable()"
              [class.table-row-selected]="selectedId() === trackBy()(row)"
              (click)="clickable() && rowClick.emit(row)"
            >
              @if (rowPrefix(); as prefTpl) {
                <td class="table-prefix" (click)="$event.stopPropagation()">
                  <ng-container [ngTemplateOutlet]="prefTpl" [ngTemplateOutletContext]="{ $implicit: row }" />
                </td>
              }
              @for (col of columns(); track col.key) {
                <td><span class="cell" [title]="cell(row, col)">{{ cell(row, col) }}</span></td>
              }
              @if (actions(); as tpl) {
                <td class="table-actions" (click)="$event.stopPropagation()">
                  <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{ $implicit: row }" />
                </td>
              }
            </tr>
            @if (expanded(); as expTpl) {
              @if (selectedId() === trackBy()(row)) {
                <tr class="table-row-expanded">
                  <td [attr.colspan]="columns().length + (actions() ? 1 : 0) + (rowPrefix() ? 1 : 0)">
                    <ng-container [ngTemplateOutlet]="expTpl" [ngTemplateOutletContext]="{ $implicit: row }" />
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

  onHeaderClick(key: string): void {
    const current = this.activeSort();
    const dir: 'asc' | 'desc' =
      current?.key === key
        ? current.dir === 'desc' ? 'asc' : 'desc'
        : 'desc';
    this.sortChange.emit({ key, dir });
  }

  cell(row: T, col: TableColumn<T>): string | number {
    const raw = col.value ? col.value(row) : (row as Record<string, unknown>)[col.key as string];
    return raw == null ? '—' : (raw as string | number);
  }
}
