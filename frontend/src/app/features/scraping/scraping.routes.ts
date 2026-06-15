import { Routes } from '@angular/router';

export const SCRAPING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/scraping.page').then((m) => m.ScrapingPage),
  },
];
