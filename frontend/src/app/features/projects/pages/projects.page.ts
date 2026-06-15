import { Component, inject, OnInit } from '@angular/core';
import { ProjectDto } from '@evpanel/shared';
import { TranslateModule } from '@ngx-translate/core';

import { DataTableComponent, TableColumn } from '../../../shared/ui/data-table/data-table.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { ProjectsFacade } from '../facade/projects.facade';

@Component({
  selector: 'ev-projects',
  standalone: true,
  imports: [DataTableComponent, EmptyStateComponent, TranslateModule],
  template: `
    <div class="ev-page">
      <h1 class="ev-page__title">{{ 'nav.projects' | translate }}</h1>
      @if (facade.projects().length) {
        <ev-data-table [columns]="columns" [rows]="facade.projects()" />
      } @else {
        <ev-empty-state icon="folder_off" [title]="'common.noData' | translate" />
      }
    </div>
  `,
})
export class ProjectsPage implements OnInit {
  protected readonly facade = inject(ProjectsFacade);

  protected readonly columns: TableColumn<ProjectDto>[] = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
    { key: 'githubUrl', label: 'GitHub' },
    { key: 'liveUrl', label: 'Live URL' },
    { key: 'technologies', label: 'Tech', value: (p) => p.technologies.join(', ') },
    { key: 'lastDeployAt', label: 'Last deploy' },
  ];

  ngOnInit(): void {
    this.facade.load();
  }
}
