import { JobFilter, JobOfferDto } from '@evpanel/shared';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';

import { JobsActions } from './jobs.actions';

export const JOBS_FEATURE_KEY = 'jobs';

export interface JobsState extends EntityState<JobOfferDto> {
  selectedId: string | null;
  filter: JobFilter;
  loading: boolean;
  error: string | null;
}

export const jobsAdapter: EntityAdapter<JobOfferDto> = createEntityAdapter<JobOfferDto>({
  selectId: (job) => job.id,
  sortComparer: (a, b) => (b.publishedDate ?? '').localeCompare(a.publishedDate ?? ''),
});

export const initialJobsState: JobsState = jobsAdapter.getInitialState({
  selectedId: null,
  filter: {},
  loading: false,
  error: null,
});

export const jobsReducer = createReducer(
  initialJobsState,
  on(JobsActions.load, (state, { filter }) => ({ ...state, loading: true, error: null, filter })),
  on(JobsActions.loadSuccess, (state, { jobs }) =>
    jobsAdapter.setAll(jobs, { ...state, loading: false }),
  ),
  on(JobsActions.loadFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(JobsActions.selectSuccess, (state, { job }) =>
    jobsAdapter.upsertOne(job, { ...state, selectedId: job.id }),
  ),
  on(JobsActions.select, (state, { id }) => ({ ...state, selectedId: id })),
  on(JobsActions.clearSelection, (state) => ({ ...state, selectedId: null })),
  on(JobsActions.setFilter, (state, { filter }) => ({ ...state, filter })),

  on(JobsActions.deleteSuccess, (state, { id }) => jobsAdapter.removeOne(id, state)),
  on(JobsActions.deleteFailure, (state, { error }) => ({ ...state, error })),

  on(JobsActions.setDismissedSuccess, (state, { job }) => jobsAdapter.upsertOne(job, state)),
  on(JobsActions.setDismissedFailure, (state, { error }) => ({ ...state, error })),
);
