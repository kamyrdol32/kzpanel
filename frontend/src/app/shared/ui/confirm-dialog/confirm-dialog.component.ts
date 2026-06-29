import { Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Reusable confirmation modal. Controlled by the parent via the `open` input;
 * emits `confirm` / `cancel`. Labels/title/message accept i18n keys.
 */
@Component({
  selector: 'kz-confirm-dialog',
  standalone: true,
  imports: [TranslateModule],
  template: `
    @if (open()) {
      <div class="overlay" (click)="cancel.emit()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <h3 class="dialog-title">{{ title() | translate }}</h3>
          <p class="dialog-msg">{{ message() | translate }}</p>
          <div class="dialog-actions">
            <button class="btn btn-ghost" (click)="cancel.emit()">
              {{ cancelLabel() | translate }}
            </button>
            <button class="btn btn-danger" (click)="confirm.emit()">
              {{ confirmLabel() | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('common.confirm');
  readonly message = input('');
  readonly confirmLabel = input('common.delete');
  readonly cancelLabel = input('common.cancel');

  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
