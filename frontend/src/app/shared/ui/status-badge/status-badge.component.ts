import { Component, input } from '@angular/core';

export type BadgeTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

@Component({
  selector: 'kz-status-badge',
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
        border: 1px solid var(--kz-border);
        background: var(--kz-surface-2);
        color: var(--kz-text);
      }
      .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
      .badge-success { color: var(--kz-success); }
      .badge-danger { color: var(--kz-danger); }
      .badge-warning { color: var(--kz-warning); }
      .badge-info { color: var(--kz-info); }
      .badge-neutral { color: var(--kz-text-muted); }
    `,
  ],
})
export class StatusBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<BadgeTone>('neutral');
}
