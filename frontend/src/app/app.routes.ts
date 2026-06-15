import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { ShellComponent } from './core/layout/shell.component';

export const APP_ROUTES: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'projects',
        loadChildren: () =>
          import('./features/projects/projects.routes').then((m) => m.PROJECTS_ROUTES),
      },
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
        path: 'monitoring',
        loadChildren: () =>
          import('./features/monitoring/monitoring.routes').then((m) => m.MONITORING_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
