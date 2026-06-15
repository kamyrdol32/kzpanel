import { UpperCasePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../auth/auth.service';
import { LanguageService } from '../i18n/language.service';
import { ThemeService } from '../theme/theme.service';

interface NavItem {
  path: string;
  icon: string;
  labelKey: string;
}

@Component({
  selector: 'ev-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule, UpperCasePipe],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  protected readonly theme = inject(ThemeService);
  protected readonly language = inject(LanguageService);
  private readonly auth = inject(AuthService);

  protected readonly nav: NavItem[] = [
    { path: '/dashboard', icon: 'dashboard', labelKey: 'nav.dashboard' },
    { path: '/projects', icon: 'folder', labelKey: 'nav.projects' },
    { path: '/recruitment', icon: 'work_history', labelKey: 'nav.recruitment' },
    { path: '/jobs', icon: 'work', labelKey: 'nav.jobs' },
    { path: '/scraping', icon: 'travel_explore', labelKey: 'nav.scraping' },
    { path: '/monitoring', icon: 'monitor_heart', labelKey: 'nav.monitoring' },
  ];

  ngOnInit(): void {
    this.language.init();
  }

  logout(): void {
    this.auth.logout();
  }
}
