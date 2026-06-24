import { JobFilter, JobOfferDto } from '@kzpanel/shared';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export type JobSortField = 'publishedDate' | 'salaryMin' | 'title' | 'company' | 'location';
export type SortDir = 'asc' | 'desc';

export const JobsActions = createActionGroup({
  source: 'Jobs',
  events: {
    Load: props<{ filter: JobFilter }>(),
    'Load Success': props<{ jobs: JobOfferDto[] }>(),
    'Load Failure': props<{ error: string }>(),

    Select: props<{ id: string }>(),
    'Select Success': props<{ job: JobOfferDto }>(),

    'Set Filter': props<{ filter: JobFilter }>(),
    'Set Sort': props<{ sortField: JobSortField; sortDir: SortDir }>(),
    'Clear Selection': emptyProps(),

    Delete: props<{ id: string }>(),
    'Delete Success': props<{ id: string }>(),
    'Delete Failure': props<{ error: string }>(),

    'Set Dismissed': props<{ id: string; dismissed: boolean }>(),
    'Set Dismissed Success': props<{ job: JobOfferDto }>(),
    'Set Dismissed Failure': props<{ error: string }>(),
  },
});
