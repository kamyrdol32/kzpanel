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
  selector: 'kz-settings',
  standalone: true,
  imports: [TranslateModule, UpperCasePipe, ReactiveFormsModule],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
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
