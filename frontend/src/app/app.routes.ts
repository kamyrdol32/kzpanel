import { Routes } from '@angular/router';
import { Permission } from '@kzpanel/shared';

import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';
import { permissionGuard } from './core/auth/permission.guard';
import { AppLayoutComponent } from './core/layout/app-layout.component';

export const APP_ROUTES: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'recruitment' },
      {
        path: 'recruitment',
        canActivate: [permissionGuard(Permission.RECRUITMENT_MANAGE)],
        data: { titleKey: 'nav.recruitment' },
        loadChildren: () =>
          import('./features/recruitment/recruitment.routes').then((m) => m.RECRUITMENT_ROUTES),
      },
      {
        path: 'jobs',
        canActivate: [permissionGuard(Permission.JOBS_VIEW)],
        data: { titleKey: 'nav.jobs', descriptionKey: 'jobs.title' },
        loadChildren: () => import('./features/jobs/jobs.routes').then((m) => m.JOBS_ROUTES),
      },
      {
        path: 'scraping',
        canActivate: [permissionGuard(Permission.SCRAPE_RUN, Permission.SCRAPE_TARGETS_MANAGE)],
        data: { titleKey: 'nav.scraping' },
        loadChildren: () =>
          import('./features/scraping/scraping.routes').then((m) => m.SCRAPING_ROUTES),
      },
      {
        path: 'settings',
        data: { titleKey: 'settings.title' },
        loadComponent: () => import('./features/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        data: { titleKey: 'users.title' },
        loadChildren: () => import('./features/users/users.routes').then((m) => m.USERS_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
