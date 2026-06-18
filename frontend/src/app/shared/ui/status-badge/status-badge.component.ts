import { Component, input } from '@angular/core';

export type BadgeTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

@Component({
  selector: 'ev-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="'badge-' + tone()"><span class="dot"></span>{{ label() }}</span>`,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        border: 1px solid var(--ev-border);
        background: var(--ev-surface-2);
        color: var(--ev-text);
      }
      .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
      .badge-success { color: var(--ev-success); }
      .badge-danger { color: var(--ev-danger); }
      .badge-warning { color: var(--ev-warning); }
      .badge-info { color: var(--ev-info); }
      .badge-neutral { color: var(--ev-text-muted); }
    `,
  ],
})
export class StatusBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<BadgeTone>('neutral');
}
