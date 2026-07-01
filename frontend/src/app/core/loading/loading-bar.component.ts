import { Component, inject } from '@angular/core';

import { LoadingService } from './loading.service';

@Component({
  selector: 'kz-loading-bar',
  standalone: true,
  templateUrl: './loading-bar.component.html',
  styleUrl: './loading-bar.component.scss',
})
export class LoadingBarComponent {
  protected readonly loading = inject(LoadingService).loading;
}
