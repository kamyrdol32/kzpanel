import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    data: { titleKey: 'auth.signIn' },
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    data: { titleKey: 'auth.createAccount' },
    loadComponent: () => import('./pages/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'forgot-password',
    data: { titleKey: 'auth.forgotPassword' },
    loadComponent: () => import('./pages/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    data: { titleKey: 'auth.resetPassword' },
    loadComponent: () => import('./pages/reset-password.page').then((m) => m.ResetPasswordPage),
  },
];
