import { inject, Injectable } from '@angular/core';
import { JobFilter } from '@evpanel/shared';
import { Store } from '@ngrx/store';

import { JobsActions } from '../store/jobs.actions';
import {
  selectAllJobs,
  selectJobsError,
  selectJobsFilter,
  selectJobsLoading,
  selectSelectedJob,
} from '../store/jobs.selectors';

/**
 * The single interaction surface for jobs components. Components read these
 * signals and call these methods — they never import the Store directly.
 */
@Injectable({ providedIn: 'root' })
export class JobsFacade {
  private readonly store = inject(Store);

  readonly jobs = this.store.selectSignal(selectAllJobs);
  readonly loading = this.store.selectSignal(selectJobsLoading);
  readonly error = this.store.selectSignal(selectJobsError);
  readonly filter = this.store.selectSignal(selectJobsFilter);
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

  remove(id: string): void {
    this.store.dispatch(JobsActions.delete({ id }));
  }

  setDismissed(id: string, dismissed: boolean): void {
    this.store.dispatch(JobsActions.setDismissed({ id, dismissed }));
  }
}
