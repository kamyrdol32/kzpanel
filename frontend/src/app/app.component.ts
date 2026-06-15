import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'ev-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent implements OnInit {
  private readonly theme = inject(ThemeService);

  ngOnInit(): void {
    this.theme.init();
  }
}
