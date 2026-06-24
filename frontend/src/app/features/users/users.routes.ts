import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    data: { titleKey: 'users.title' },
    loadComponent: () => import('./pages/users.page').then((m) => m.UsersPage),
  },
];
