import { Component, computed, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Permission, Role } from '@kzpanel/shared';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../auth/auth.service';
import { LanguageService } from '../i18n/language.service';
import { ThemeService } from '../theme/theme.service';
import { ToastComponent } from '../toast/toast.component';
import { WebSocketService } from '../websocket/websocket.service';

interface NavItem {
  path: string;
  labelKey: string;
  permissions?: Permission[];
}

@Component({
  selector: 'kz-app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule, ToastComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent implements OnInit {
  protected readonly theme = inject(ThemeService);
  protected readonly language = inject(LanguageService);
  private readonly auth = inject(AuthService);
  private readonly ws = inject(WebSocketService);
  private readonly router = inject(Router);
  private readonly el = inject(ElementRef);

  protected readonly scrolled = signal(false);
  protected readonly dropdownOpen = signal(false);
  protected readonly adminOpen = signal(false);
  protected readonly profileOpen = signal(false);

  protected readonly user = this.auth.user;
  protected readonly initial = computed(() => (this.user()?.username ?? '?').charAt(0).toUpperCase());

  private readonly allDropdownItems: NavItem[] = [
    { path: '/recruitment', labelKey: 'nav.recruitment', permissions: [Permission.RECRUITMENT_MANAGE] },
    { path: '/jobs',        labelKey: 'nav.jobs',        permissions: [Permission.JOBS_VIEW] },
    { path: '/scraping',    labelKey: 'nav.scraping',    permissions: [Permission.SCRAPE_RUN, Permission.SCRAPE_TARGETS_MANAGE] },
  ];

  protected readonly isAdmin = computed(() => this.user()?.role === Role.ADMIN);

  protected readonly dropdownItems = computed(() =>
    this.allDropdownItems.filter((item) => {
      if (!item.permissions) {
        return true;
      }
      return item.permissions.some((p) => this.auth.hasPermission(p));
    }),
  );

  protected readonly adminItems: NavItem[] = [
    { path: '/users', labelKey: 'nav.users' },
  ];

  @HostListener('window:scroll', [])
  protected onScroll(): void {
    this.scrolled.set(window.scrollY > 60);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.dropdownOpen.set(false);
      this.adminOpen.set(false);
      this.profileOpen.set(false);
    }
  }

  public ngOnInit(): void {
    this.language.init();
    this.ws.connect();
  }

  protected toggleDropdown(): void {
    this.dropdownOpen.update((v) => !v);
  }

  protected closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  protected toggleAdminDropdown(): void {
    this.adminOpen.update((v) => !v);
  }

  protected closeAdminDropdown(): void {
    this.adminOpen.set(false);
  }

  protected toggleProfile(): void {
    this.profileOpen.update((v) => !v);
  }

  protected closeProfile(): void {
    this.profileOpen.set(false);
  }

  protected logout(): void {
    this.ws.disconnect();
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }
}
