import { NgTemplateOutlet } from '@angular/common';
import { Component, contentChild, input, output, TemplateRef } from '@angular/core';

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  /** optional value accessor for computed/nested cells */
  value?: (row: T) => string | number | null;
}

/**
 * Generic, presentational data table. Smart parent supplies rows + columns;
 * an optional `actions` template renders a trailing column. No store access.
 * Optional `expanded` template renders a full-width detail row when a row is
 * selected (selected row id is tracked externally via `selectedId`).
 */
@Component({
  selector: 'ev-data-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th>{{ col.label }}</th>
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
  /** optional per-row CSS class(es), e.g. to grey out dismissed rows */
  readonly rowClass = input<(row: T) => string>(() => '');

  readonly rowClick = output<T>();

  readonly rowPrefix = contentChild<TemplateRef<{ $implicit: T }>>('rowPrefix');
  readonly actions = contentChild<TemplateRef<{ $implicit: T }>>('actions');
  readonly expanded = contentChild<TemplateRef<{ $implicit: T }>>('expanded');

  cell(row: T, col: TableColumn<T>): string | number {
    const raw = col.value ? col.value(row) : (row as Record<string, unknown>)[col.key as string];
    return raw == null ? '—' : (raw as string | number);
  }
}
