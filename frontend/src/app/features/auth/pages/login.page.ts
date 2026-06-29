import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../core/auth/auth.service';
import { ToastComponent } from '../../../core/toast/toast.component';
import { ToastService } from '../../../core/toast/toast.service';

const STORAGE_KEY = 'kz-saved-username';

@Component({
  selector: 'kz-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule, ToastComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  public ngOnInit(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      this.form.patchValue({ username: saved, rememberMe: true });
    }
    this.toast.infoHtml(this.translate.instant('auth.testAccount'), 12000);
  }

  protected submit(): void {
    if (this.form.invalid) { return; }
    this.loading.set(true);
    this.error.set(null);
    const { username, password, rememberMe } = this.form.getRawValue();

    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, username);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    this.auth.login(username, password).subscribe({
      next: () => void this.router.navigate(['/']),
      error: () => {
        this.error.set('auth.invalidCredentials');
        this.loading.set(false);
      },
    });
  }
}
