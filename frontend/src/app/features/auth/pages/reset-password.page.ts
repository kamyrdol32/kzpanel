import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../../core/auth/auth.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('newPassword')?.value;
  const confirm = group.get('confirm')?.value;
  return password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'kz-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './reset-password.page.html',
  styleUrl: './login.page.scss',
})
export class ResetPasswordPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly done = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      token: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  public ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.form.patchValue({ token });
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { token, newPassword } = this.form.getRawValue();

    this.auth.resetPassword({ token, newPassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
      },
      error: () => {
        this.error.set('auth.resetError');
        this.loading.set(false);
      },
    });
  }
}
