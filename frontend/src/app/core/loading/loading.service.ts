import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly active = signal(0);
  public readonly loading = computed(() => this.active() > 0);

  public start(): void {
    this.active.update((n) => n + 1);
  }

  public stop(): void {
    this.active.update((n) => Math.max(0, n - 1));
  }
}
