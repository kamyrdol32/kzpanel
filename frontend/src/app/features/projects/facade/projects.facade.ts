import { inject, Injectable, signal } from '@angular/core';
import { ProjectDto } from '@evpanel/shared';

import { ApiService } from '../../../core/http/api.service';

/**
 * Lean facade (signal-based) for the Projects module. When the module grows it
 * can be promoted to the full NgRx + EntityAdapter pattern used by Jobs.
 */
@Injectable({ providedIn: 'root' })
export class ProjectsFacade {
  private readonly api = inject(ApiService);

  readonly projects = signal<ProjectDto[]>([]);
  readonly loading = signal(false);

  load(): void {
    this.loading.set(true);
    this.api.get<ProjectDto[]>('/projects').subscribe({
      next: (rows) => {
        this.projects.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
