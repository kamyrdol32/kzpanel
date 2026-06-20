import { UpperCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../core/auth/auth.service';
import { LanguageService } from '../../core/i18n/language.service';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'ev-settings',
  standalone: true,
  imports: [TranslateModule, UpperCasePipe],
  template: `
    <div class="ev-page">
      <h1 class="ev-page-title" style="margin: 0 0 20px">{{ 'settings.title' | translate }}</h1>

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
    `,
  ],
})
export class SettingsPage {
  protected readonly theme = inject(ThemeService);
  protected readonly language = inject(LanguageService);
  protected readonly auth = inject(AuthService);
}
