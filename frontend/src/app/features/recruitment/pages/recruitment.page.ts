import { DatePipe } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RecruitmentDto, RecruitmentStatus } from '@evpanel/shared';
import { TranslateModule } from '@ngx-translate/core';

import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { RecruitmentFacade } from '../facade/recruitment.facade';

@Component({
  selector: 'ev-recruitment',
  standalone: true,
  imports: [FormsModule, DatePipe, EmptyStateComponent, ConfirmDialogComponent, TranslateModule],
  templateUrl: './recruitment.page.html',
  styleUrl: './recruitment.page.scss',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, maxHeight: '0px', overflow: 'hidden' }),
        animate('220ms ease-out', style({ opacity: 1, maxHeight: '400px' })),
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ opacity: 0, maxHeight: '0px', overflow: 'hidden' })),
      ]),
    ]),
  ],
})
export class RecruitmentPage implements OnInit {
  protected readonly facade = inject(RecruitmentFacade);
  protected readonly statuses = Object.values(RecruitmentStatus);

  protected readonly expandedId = signal<string | null>(null);
  protected readonly pendingDelete = signal<RecruitmentDto | null>(null);

  ngOnInit(): void {
    this.facade.load();
  }

  isExpanded(id: string): boolean {
    return this.expandedId() === id;
  }

  toggleRow(id: string): void {
    this.expandedId.update((cur) => (cur === id ? null : id));
  }

  onStatusChange(id: string, value: string): void {
    this.facade.updateStatus(id, value as RecruitmentStatus);
  }

  askDelete(item: RecruitmentDto): void {
    this.pendingDelete.set(item);
  }

  confirmDelete(): void {
    const item = this.pendingDelete();
    if (item) this.facade.remove(item.id);
    this.pendingDelete.set(null);
  }

  tone(status: RecruitmentStatus): string {
    switch (status) {
      case RecruitmentStatus.HIRED:
      case RecruitmentStatus.OFFER:
        return 'success';
      case RecruitmentStatus.REJECTED:
        return 'danger';
      case RecruitmentStatus.INTERVIEW:
      case RecruitmentStatus.TECHNICAL:
        return 'warning';
      default:
        return 'neutral';
    }
  }
}
