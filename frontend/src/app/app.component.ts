import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LanguageService } from './core/i18n/language.service';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'ev-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent implements OnInit {
  private readonly theme = inject(ThemeService);
  private readonly language = inject(LanguageService);

  ngOnInit(): void {
    this.theme.init();
    // Init language app-wide (not just inside the authenticated layout) so
    // translations are loaded on public routes (login) too — page titles etc.
    this.language.init();
  }
}
