import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';

import * as jobsEffects from './store/jobs.effects';
import { JOBS_FEATURE_KEY, jobsReducer } from './store/jobs.reducer';

export const JOBS_ROUTES: Routes = [
  {
    path: '',
    // feature state + effects registered lazily with the route
    providers: [provideState(JOBS_FEATURE_KEY, jobsReducer), provideEffects(jobsEffects)],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/jobs-list.page').then((m) => m.JobsListPage),
      },
      {
        path: ':id',
        loadComponent: () => import('./pages/job-details.page').then((m) => m.JobDetailsPage),
      },
    ],
  },
];
