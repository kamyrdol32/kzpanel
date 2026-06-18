import { Component, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../auth/auth.service';
import { LanguageService } from '../i18n/language.service';
import { ThemeService } from '../theme/theme.service';

interface NavItem {
  path: string;
  labelKey: string;
}

@Component({
  selector: 'ev-app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent implements OnInit {
  protected readonly theme = inject(ThemeService);
  protected readonly language = inject(LanguageService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly el = inject(ElementRef);

  protected readonly scrolled = signal(false);
  protected readonly dropdownOpen = signal(false);

  protected readonly dropdownItems: NavItem[] = [
    { path: '/recruitment', labelKey: 'nav.recruitment' },
    { path: '/jobs',        labelKey: 'nav.jobs' },
    { path: '/scraping',    labelKey: 'nav.scraping' },
  ];

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.scrolled.set(window.scrollY > 60);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.dropdownOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.language.init();
  }

  toggleDropdown(): void {
    this.dropdownOpen.update((v) => !v);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }
}
