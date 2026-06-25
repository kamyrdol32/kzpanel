import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';
const STORAGE_KEY = 'ev-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly _mode = signal<ThemeMode>('dark');

  readonly mode = this._mode.asReadonly();
  readonly isDark = computed(() => this._mode() === 'dark');

  public init(): void {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'dark';
    this.set(saved);
  }

  public toggle(): void {
    this.set(this._mode() === 'dark' ? 'light' : 'dark');
  }

  public set(mode: ThemeMode): void {
    this._mode.set(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    const root = this.document.documentElement;
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.add(`theme-${mode}`);
  }
}
