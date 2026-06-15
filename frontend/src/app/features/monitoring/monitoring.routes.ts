import { Routes } from '@angular/router';

export const MONITORING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/monitoring.page').then((m) => m.MonitoringPage),
  },
];
