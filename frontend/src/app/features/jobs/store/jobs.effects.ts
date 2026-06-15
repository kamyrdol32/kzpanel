import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, switchMap } from 'rxjs';

import { JobsApi } from '../data-access/jobs.api';

import { JobsActions } from './jobs.actions';

export const loadJobs$ = createEffect(
  (actions$ = inject(Actions), api = inject(JobsApi)) =>
    actions$.pipe(
      ofType(JobsActions.load),
      switchMap(({ filter }) =>
        api.list(filter).pipe(
          map((jobs) => JobsActions.loadSuccess({ jobs })),
          catchError((err) => of(JobsActions.loadFailure({ error: err.message ?? 'Load failed' }))),
        ),
      ),
    ),
  { functional: true },
);

export const selectJob$ = createEffect(
  (actions$ = inject(Actions), api = inject(JobsApi)) =>
    actions$.pipe(
      ofType(JobsActions.select),
      switchMap(({ id }) =>
        api.getOne(id).pipe(
          map((job) => JobsActions.selectSuccess({ job })),
          catchError((err) => of(JobsActions.loadFailure({ error: err.message ?? 'Load failed' }))),
        ),
      ),
    ),
  { functional: true },
);

export const deleteJob$ = createEffect(
  (actions$ = inject(Actions), api = inject(JobsApi)) =>
    actions$.pipe(
      ofType(JobsActions.delete),
      mergeMap(({ id }) =>
        api.remove(id).pipe(
          map(() => JobsActions.deleteSuccess({ id })),
          catchError((err) =>
            of(JobsActions.deleteFailure({ error: err.message ?? 'Delete failed' })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const setDismissed$ = createEffect(
  (actions$ = inject(Actions), api = inject(JobsApi)) =>
    actions$.pipe(
      ofType(JobsActions.setDismissed),
      mergeMap(({ id, dismissed }) =>
        api.update(id, { dismissed }).pipe(
          map((job) => JobsActions.setDismissedSuccess({ job })),
          catchError((err) =>
            of(JobsActions.setDismissedFailure({ error: err.message ?? 'Update failed' })),
          ),
        ),
      ),
    ),
  { functional: true },
);
