import { Component, input } from '@angular/core';

@Component({
  selector: 'kz-empty-state',
  standalone: true,
  template: `
    <div class="empty">
      <span class="material-symbols-rounded empty-icon">{{ icon() }}</span>
      <p class="empty-title">{{ title() }}</p>
      @if (description()) {
        <p class="empty-desc">{{ description() }}</p>
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
        color: var(--kz-text-muted);
      }
      .empty-icon { font-size: 48px; opacity: 0.5; }
      .empty-title { font-weight: 600; color: var(--kz-text); margin: 12px 0 4px; }
      .empty-desc { margin: 0; font-size: 13px; }
    `,
  ],
})
export class EmptyStateComponent {
  readonly icon = input<string>('inbox');
  readonly title = input.required<string>();
  readonly description = input<string>();
}
