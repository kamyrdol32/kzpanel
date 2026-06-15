import { inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLang = 'pl' | 'en';
const STORAGE_KEY = 'ev-lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly _lang = signal<AppLang>('pl');
  readonly lang = this._lang.asReadonly();

  init(): void {
    const saved = (localStorage.getItem(STORAGE_KEY) as AppLang | null) ?? 'pl';
    this.use(saved);
  }

  use(lang: AppLang): void {
    this._lang.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    this.translate.use(lang);
  }

  toggle(): void {
    this.use(this._lang() === 'pl' ? 'en' : 'pl');
  }
}
