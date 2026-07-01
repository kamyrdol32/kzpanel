import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LanguageService } from './core/i18n/language.service';
import { LoadingBarComponent } from './core/loading/loading-bar.component';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'kz-root',
  standalone: true,
  imports: [RouterOutlet, LoadingBarComponent],
  template: '<kz-loading-bar /><router-outlet />',
})
export class AppComponent implements OnInit {
  private readonly theme = inject(ThemeService);
  private readonly language = inject(LanguageService);

  ngOnInit(): void {
    this.theme.init();
    this.language.init();
  }
}
