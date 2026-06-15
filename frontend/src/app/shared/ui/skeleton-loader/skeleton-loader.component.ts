import { NgStyle } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'ev-skeleton',
  standalone: true,
  imports: [NgStyle],
  template: `
    @for (row of rows(); track $index) {
      <div class="skeleton" [ngStyle]="{ width: width(), height: height() }"></div>
    }
  `,
  styles: [
    `
      .skeleton {
        border-radius: 8px;
        margin-bottom: 10px;
        background: linear-gradient(
          90deg,
          var(--ev-surface) 25%,
          var(--ev-surface-2) 37%,
          var(--ev-surface) 63%
        );
        background-size: 400% 100%;
        animation: shimmer 1.4s ease infinite;
      }
      @keyframes shimmer {
        0% { background-position: 100% 0; }
        100% { background-position: -100% 0; }
      }
    `,
  ],
})
export class SkeletonLoaderComponent {
  readonly count = input<number>(3);
  readonly width = input<string>('100%');
  readonly height = input<string>('20px');

  rows(): number[] {
    return Array.from({ length: this.count() });
  }
}
