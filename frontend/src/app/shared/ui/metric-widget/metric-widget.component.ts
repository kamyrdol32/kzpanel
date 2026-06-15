import { Component, input } from '@angular/core';

@Component({
  selector: 'ev-metric-widget',
  standalone: true,
  template: `
    <div class="metric">
      <div class="metric__icon"><span class="material-symbols-rounded">{{ icon() }}</span></div>
      <div class="metric__body">
        <div class="metric__value">{{ value() }}</div>
        <div class="metric__label">{{ label() }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      .metric {
        display: flex;
        align-items: center;
        gap: 16px;
        background: var(--ev-surface);
        border: 1px solid var(--ev-border);
        border-radius: 16px;
        padding: 20px;
      }
      .metric__icon {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: var(--ev-surface-2);
        color: var(--ev-accent);
      }
      .metric__value { font-size: 28px; font-weight: 700; line-height: 1; }
      .metric__label { color: var(--ev-text-muted); font-size: 13px; margin-top: 4px; }
    `,
  ],
})
export class MetricWidgetComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input<string>('analytics');
}
