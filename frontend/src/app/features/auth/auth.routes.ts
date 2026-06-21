import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    data: { titleKey: 'auth.signIn' },
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage),
  },
];
