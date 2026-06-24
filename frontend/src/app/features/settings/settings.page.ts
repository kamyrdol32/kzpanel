import { UpperCasePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../core/auth/auth.service';
import { LanguageService } from '../../core/i18n/language.service';
import { ThemeService } from '../../core/theme/theme.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const next = group.get('newPassword')?.value;
  const confirm = group.get('confirm')?.value;
  return next === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'ev-settings',
  standalone: true,
  imports: [TranslateModule, UpperCasePipe, ReactiveFormsModule],
  template: `
    <div class="ev-page">
      <h1 class="ev-page-title" style="margin: 0 0 48px">{{ 'settings.title' | translate }}</h1>

      <section class="settings-card">
        <h2 class="settings-section-title">{{ 'settings.account' | translate }}</h2>
        <div class="settings-row">
          <span class="settings-label">{{ 'settings.username' | translate }}</span>
          <span class="settings-value">{{ auth.user()?.username }}</span>
        </div>
        @if (auth.user()?.email) {
          <div class="settings-row">
            <span class="settings-label">{{ 'settings.email' | translate }}</span>
            <span class="settings-value">{{ auth.user()?.email }}</span>
          </div>
        }
        <div class="settings-row">
          <span class="settings-label">{{ 'settings.role' | translate }}</span>
          <span class="settings-value">{{ auth.user()?.role }}</span>
        </div>
      </section>

      <section class="settings-card">
        <h2 class="settings-section-title">{{ 'settings.preferences' | translate }}</h2>
        <div class="settings-row">
          <span class="settings-label">{{ 'common.theme' | translate }}</span>
          <button class="settings-btn" (click)="theme.toggle()">{{ theme.mode() }}</button>
        </div>
        <div class="settings-row">
          <span class="settings-label">{{ 'common.language' | translate }}</span>
          <button class="settings-btn" (click)="language.toggle()">{{ language.lang() | uppercase }}</button>
        </div>
      </section>

      <section class="settings-card">
        <h2 class="settings-section-title">{{ 'settings.changePassword' | translate }}</h2>
        <form class="settings-form" [formGroup]="passwordForm" (ngSubmit)="submitPassword()">
          <label class="settings-field">
            <span class="settings-label">{{ 'auth.currentPassword' | translate }}</span>
            <input type="password" formControlName="currentPassword" autocomplete="current-password" />
          </label>
          <label class="settings-field">
            <span class="settings-label">{{ 'auth.newPassword' | translate }}</span>
            <input type="password" formControlName="newPassword" autocomplete="new-password" />
          </label>
          <label class="settings-field">
            <span class="settings-label">{{ 'auth.confirmPassword' | translate }}</span>
            <input type="password" formControlName="confirm" autocomplete="new-password" />
          </label>

          @if (passwordForm.errors?.['mismatch'] && passwordForm.get('confirm')?.touched) {
            <p class="settings-error">{{ 'auth.passwordsMismatch' | translate }}</p>
          }
          @if (passwordError()) {
            <p class="settings-error">{{ passwordError()! | translate }}</p>
          }
          @if (passwordDone()) {
            <p class="settings-success">{{ 'auth.changePasswordDone' | translate }}</p>
          }

          <button type="submit" class="settings-btn settings-btn-primary"
                  [disabled]="passwordLoading() || passwordForm.invalid">
            {{ (passwordLoading() ? 'common.loading' : 'settings.changePassword') | translate }}
          </button>
        </form>
      </section>
    </div>
  `,
  styles: [
    `
      .settings-card {
        background: var(--ev-surface);
        border: 1px solid var(--ev-border);
        border-radius: 14px;
        padding: 20px 22px;
        margin-bottom: 16px;
        max-width: 560px;
      }
      .settings-section-title {
        margin: 0 0 14px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--ev-text-muted);
      }
      .settings-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 10px 0;
        border-top: 1px solid var(--ev-border);
      }
      .settings-row:first-of-type {
        border-top: none;
      }
      .settings-label {
        font-size: 14px;
        color: var(--ev-text-muted);
      }
      .settings-value {
        font-size: 14px;
        font-weight: 500;
        color: var(--ev-text);
      }
      .settings-btn {
        padding: 6px 14px;
        border: 1px solid var(--ev-border);
        border-radius: 8px;
        background: var(--ev-bg);
        color: var(--ev-text);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        text-transform: capitalize;
        transition: border-color 0.15s;
      }
      .settings-btn:hover {
        border-color: var(--ev-accent);
      }
      .settings-btn-primary {
        background: var(--ev-accent);
        color: #fff;
        border-color: var(--ev-accent);
        align-self: flex-start;
        text-transform: none;
        margin-top: 4px;
      }
      .settings-btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .settings-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .settings-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .settings-field input {
        background: var(--ev-bg);
        border: 1px solid var(--ev-border);
        border-radius: 8px;
        padding: 10px 12px;
        color: var(--ev-text);
        font-size: 14px;
        outline: none;
        transition: border-color 0.15s;
      }
      .settings-field input:focus {
        border-color: var(--ev-accent);
      }
      .settings-error {
        color: var(--ev-danger);
        font-size: 13px;
        margin: 0;
      }
      .settings-success {
        color: var(--ev-success);
        font-size: 13px;
        margin: 0;
      }
    `,
  ],
})
export class SettingsPage {
  protected readonly theme = inject(ThemeService);
  protected readonly language = inject(LanguageService);
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly passwordLoading = signal(false);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly passwordDone = signal(false);

  protected readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  protected submitPassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }
    this.passwordLoading.set(true);
    this.passwordError.set(null);
    this.passwordDone.set(false);
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.auth.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.passwordLoading.set(false);
        this.passwordDone.set(true);
        this.passwordForm.reset({ currentPassword: '', newPassword: '', confirm: '' });
      },
      error: () => {
        this.passwordError.set('auth.changePasswordError');
        this.passwordLoading.set(false);
      },
    });
  }
}
