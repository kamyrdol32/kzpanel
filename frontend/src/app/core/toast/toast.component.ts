import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ToastService } from './toast.service';

@Component({
  selector: 'kz-toast',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  protected readonly toast = inject(ToastService);
}
