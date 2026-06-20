import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
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
        loadChildren: () =>
          import('./features/recruitment/recruitment.routes').then((m) => m.RECRUITMENT_ROUTES),
      },
      {
        path: 'jobs',
        loadChildren: () => import('./features/jobs/jobs.routes').then((m) => m.JOBS_ROUTES),
      },
      {
        path: 'scraping',
        loadChildren: () =>
          import('./features/scraping/scraping.routes').then((m) => m.SCRAPING_ROUTES),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.page').then((m) => m.SettingsPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
