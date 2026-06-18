import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../../core/auth/auth.service';

const STORAGE_KEY = 'ev-saved-username';

@Component({
  selector: 'ev-login',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });

  ngOnInit(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      this.form.patchValue({ username: saved, rememberMe: true });
    }
  }

  submit(): void {
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
      next: () => void this.router.navigate(['/recruitment']),
      error: () => {
        this.error.set('auth.invalidCredentials');
        this.loading.set(false);
      },
    });
  }
}
