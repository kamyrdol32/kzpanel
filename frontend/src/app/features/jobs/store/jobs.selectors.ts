import { JobOfferDto } from '@kzpanel/shared';
import { createFeatureSelector, createSelector } from '@ngrx/store';

import { JobSortField, SortDir } from './jobs.actions';
import { jobsAdapter, JOBS_FEATURE_KEY, JobsState } from './jobs.reducer';

const selectJobsState = createFeatureSelector<JobsState>(JOBS_FEATURE_KEY);

const { selectAll, selectEntities } = jobsAdapter.getSelectors();

export const selectAllJobs = createSelector(selectJobsState, selectAll);
export const selectJobEntities = createSelector(selectJobsState, selectEntities);
export const selectJobsLoading = createSelector(selectJobsState, (s) => s.loading);
export const selectJobsError = createSelector(selectJobsState, (s) => s.error);
export const selectJobsFilter = createSelector(selectJobsState, (s) => s.filter);
export const selectJobsSort = createSelector(selectJobsState, (s) => ({
  sortField: s.sortField,
  sortDir: s.sortDir,
}));
export const selectSelectedJobId = createSelector(selectJobsState, (s) => s.selectedId);
export const selectSelectedJob = createSelector(
  selectJobEntities,
  selectSelectedJobId,
  (entities, id) => (id ? (entities[id] ?? null) : null),
);

export const selectSortedJobs = createSelector(
  selectAllJobs,
  selectJobsSort,
  (jobs, { sortField, sortDir }) => sortJobs(jobs, sortField, sortDir),
);

function sortJobs(jobs: JobOfferDto[], field: JobSortField, dir: SortDir): JobOfferDto[] {
  const sorted = [...jobs].sort((a, b) => {
    let cmp = 0;

    switch (field) {
      case 'publishedDate': {
        cmp = (a.publishedDate ?? '').localeCompare(b.publishedDate ?? '');
        break;
      }
      case 'salaryMin': {
        cmp = (a.salaryMin ?? -1) - (b.salaryMin ?? -1);
        break;
      }
      case 'title': {
        cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        break;
      }
      case 'company': {
        cmp = a.company.localeCompare(b.company, undefined, { sensitivity: 'base' });
        break;
      }
      case 'location': {
        cmp = (a.location ?? '').localeCompare(b.location ?? '', undefined, { sensitivity: 'base' });
        break;
      }
    }

    return dir === 'asc' ? cmp : -cmp;
  });

  return sorted;
}
