import { Component, input } from '@angular/core';

@Component({
  selector: 'ev-card',
  standalone: true,
  template: `
    <section class="card">
      @if (title()) {
        <header class="card__header">{{ title() }}</header>
      }
      <div class="card__body"><ng-content /></div>
    </section>
  `,
  styles: [
    `
      .card {
        background: var(--ev-surface);
        border: 1px solid var(--ev-border);
        border-radius: 16px;
        box-shadow: var(--ev-shadow-sm);
      }
      .card__header {
        padding: 16px 20px;
        font-weight: 600;
        border-bottom: 1px solid var(--ev-border);
      }
      .card__body { padding: 20px; }
    `,
  ],
})
export class CardComponent {
  readonly title = input<string>();
}
