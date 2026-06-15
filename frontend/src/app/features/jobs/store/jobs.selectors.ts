import { createFeatureSelector, createSelector } from '@ngrx/store';

import { jobsAdapter, JOBS_FEATURE_KEY, JobsState } from './jobs.reducer';

const selectJobsState = createFeatureSelector<JobsState>(JOBS_FEATURE_KEY);

const { selectAll, selectEntities } = jobsAdapter.getSelectors();

export const selectAllJobs = createSelector(selectJobsState, selectAll);
export const selectJobEntities = createSelector(selectJobsState, selectEntities);
export const selectJobsLoading = createSelector(selectJobsState, (s) => s.loading);
export const selectJobsError = createSelector(selectJobsState, (s) => s.error);
export const selectJobsFilter = createSelector(selectJobsState, (s) => s.filter);
export const selectSelectedJobId = createSelector(selectJobsState, (s) => s.selectedId);
export const selectSelectedJob = createSelector(
  selectJobEntities,
  selectSelectedJobId,
  (entities, id) => (id ? (entities[id] ?? null) : null),
);
