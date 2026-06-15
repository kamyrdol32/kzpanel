import { Routes } from '@angular/router';

export const RECRUITMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/recruitment.page').then((m) => m.RecruitmentPage),
  },
];
