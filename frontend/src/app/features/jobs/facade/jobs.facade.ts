import { inject, Injectable } from '@angular/core';
import { JobFilter } from '@evpanel/shared';
import { Store } from '@ngrx/store';

import { JobSortField, JobsActions, SortDir } from '../store/jobs.actions';
import {
  selectJobsError,
  selectJobsFilter,
  selectJobsLoading,
  selectJobsSort,
  selectSelectedJob,
  selectSortedJobs,
} from '../store/jobs.selectors';

@Injectable({ providedIn: 'root' })
export class JobsFacade {
  private readonly store = inject(Store);

  readonly jobs = this.store.selectSignal(selectSortedJobs);
  readonly loading = this.store.selectSignal(selectJobsLoading);
  readonly error = this.store.selectSignal(selectJobsError);
  readonly filter = this.store.selectSignal(selectJobsFilter);
  readonly sort = this.store.selectSignal(selectJobsSort);
  readonly selected = this.store.selectSignal(selectSelectedJob);

  load(filter: JobFilter = {}): void {
    this.store.dispatch(JobsActions.load({ filter }));
  }

  open(id: string): void {
    this.store.dispatch(JobsActions.select({ id }));
  }

  clearSelection(): void {
    this.store.dispatch(JobsActions.clearSelection());
  }

  setFilter(filter: JobFilter): void {
    this.store.dispatch(JobsActions.setFilter({ filter }));
    this.store.dispatch(JobsActions.load({ filter }));
  }

  setSort(sortField: JobSortField, sortDir: SortDir): void {
    this.store.dispatch(JobsActions.setSort({ sortField, sortDir }));
  }

  remove(id: string): void {
    this.store.dispatch(JobsActions.delete({ id }));
  }

  setDismissed(id: string, dismissed: boolean): void {
    this.store.dispatch(JobsActions.setDismissed({ id, dismissed }));
  }
}
