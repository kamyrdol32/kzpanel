import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AdminUserDto } from '@kzpanel/shared';
import { TranslateModule } from '@ngx-translate/core';

import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UsersApi } from '../data-access/users.api';

@Component({
  selector: 'ev-users',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent, TranslateModule],
  templateUrl: './users.page.html',
  styleUrl: './users.page.scss',
})
export class UsersPage implements OnInit {
  private readonly api = inject(UsersApi);

  protected readonly users = signal<AdminUserDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly pendingId = signal<string | null>(null);

  /** View-model rows with precomputed display state, so the template calls no methods. */
  protected readonly rows = computed(() => {
    const pendingId = this.pendingId();
    return this.users().map((user) => ({
      ...user,
      statusClass: user.isActive ? 'status-active' : 'status-inactive',
      statusLabel: user.isActive ? 'users.statusActive' : 'users.statusInactive',
      actionLabel: user.isActive ? 'users.deactivate' : 'users.activate',
      pending: user.id === pendingId,
    }));
  });

  public ngOnInit(): void {
    this.load();
  }

  protected toggleActive(id: string, isActive: boolean): void {
    this.pendingId.set(id);
    this.api.setActive(id, { isActive: !isActive }).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        this.pendingId.set(null);
      },
      error: () => this.pendingId.set(null),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (rows) => {
        this.users.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
