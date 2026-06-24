import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AdminUserDto, Role } from '@kzpanel/shared';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/toast/toast.service';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { UsersApi } from '../data-access/users.api';

interface PendingRoleChange {
  user: AdminUserDto;
  role: Role;
}

@Component({
  selector: 'ev-users',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent, ConfirmDialogComponent, TranslateModule],
  templateUrl: './users.page.html',
  styleUrl: './users.page.scss',
})
export class UsersPage implements OnInit {
  private readonly api = inject(UsersApi);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  protected readonly roles = Object.values(Role);

  protected readonly users = signal<AdminUserDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly pendingId = signal<string | null>(null);
  protected readonly pendingDelete = signal<AdminUserDto | null>(null);
  protected readonly pendingRoleChange = signal<PendingRoleChange | null>(null);

  protected readonly currentUserId = computed(() => this.auth.user()?.id ?? '');

  protected readonly rows = computed(() => {
    const pendingId = this.pendingId();
    const currentId = this.currentUserId();
    return this.users().map((user) => ({
      ...user,
      statusClass: user.isActive ? 'status-active' : 'status-inactive',
      statusLabel: user.isActive ? 'users.statusActive' : 'users.statusInactive',
      actionLabel: user.isActive ? 'users.deactivate' : 'users.activate',
      pending: user.id === pendingId,
      isSelf: user.id === currentId,
    }));
  });

  protected readonly roleChangeMessage = computed(() => {
    const pending = this.pendingRoleChange();
    if (!pending) {
      return '';
    }
    const roleName = this.translate.instant(`enum.role.${pending.role}`);
    return this.translate.instant('users.roleChangeConfirm', { username: pending.user.username, role: roleName });
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
        const key = updated.isActive ? 'users.toastActivated' : 'users.toastDeactivated';
        this.toast.success(this.translate.instant(key, { username: updated.username }));
      },
      error: () => {
        this.pendingId.set(null);
        this.toast.error(this.translate.instant('common.errorGeneric'));
      },
    });
  }

  protected askRoleChange(user: AdminUserDto, role: Role): void {
    if (role === user.role) {
      return;
    }
    this.pendingRoleChange.set({ user, role });
  }

  protected confirmRoleChange(): void {
    const pending = this.pendingRoleChange();
    if (!pending) {
      return;
    }
    this.pendingRoleChange.set(null);
    this.pendingId.set(pending.user.id);
    this.api.setRole(pending.user.id, { role: pending.role }).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        this.pendingId.set(null);
        const roleName = this.translate.instant(`enum.role.${updated.role}`);
        this.toast.success(this.translate.instant('users.toastRoleChanged', { username: updated.username, role: roleName }));
      },
      error: () => {
        this.pendingId.set(null);
        this.toast.error(this.translate.instant('common.errorGeneric'));
      },
    });
  }

  protected cancelRoleChange(): void {
    this.pendingRoleChange.set(null);
  }

  protected askDelete(user: AdminUserDto): void {
    this.pendingDelete.set(user);
  }

  protected confirmDelete(): void {
    const user = this.pendingDelete();
    if (!user) {
      return;
    }
    this.pendingDelete.set(null);
    this.api.remove(user.id).subscribe({
      next: () => {
        this.users.update((list) => list.filter((u) => u.id !== user.id));
        this.toast.success(this.translate.instant('users.toastDeleted', { username: user.username }));
      },
      error: () => this.toast.error(this.translate.instant('common.errorGeneric')),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (rows) => {
        this.users.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error(this.translate.instant('common.errorGeneric'));
      },
    });
  }
}
