import { Component, input } from '@angular/core';

@Component({
  selector: 'ev-empty-state',
  standalone: true,
  template: `
    <div class="empty">
      <span class="material-symbols-rounded empty__icon">{{ icon() }}</span>
      <p class="empty__title">{{ title() }}</p>
      @if (description()) {
        <p class="empty__desc">{{ description() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: [
    `
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 48px 24px;
        color: var(--ev-text-muted);
      }
      .empty__icon { font-size: 48px; opacity: 0.5; }
      .empty__title { font-weight: 600; color: var(--ev-text); margin: 12px 0 4px; }
      .empty__desc { margin: 0; font-size: 13px; }
    `,
  ],
})
export class EmptyStateComponent {
  readonly icon = input<string>('inbox');
  readonly title = input.required<string>();
  readonly description = input<string>();
}
