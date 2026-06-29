import { inject, Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../../environments/environment';
import { ToastService } from '../toast/toast.service';

export interface ScrapeCompletedPayload {
  targetsProcessed: number;
  offersUpserted: number;
  userId: string | null;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private socket: Socket | null = null;

  private readonly scrapeCompletedSubject = new Subject<ScrapeCompletedPayload>();
  public readonly scrapeCompleted$ = this.scrapeCompletedSubject.asObservable();

  public connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(environment.wsUrl || window.location.origin, {
      path: '/ws',
      transports: ['websocket'],
    });

    this.socket.on('scrape:completed', (payload: ScrapeCompletedPayload) => {
      this.scrapeCompletedSubject.next(payload);
      const msg = this.translate.instant('notifications.scrapeCompleted', {
        targets: payload.targetsProcessed,
        offers: payload.offersUpserted,
      });
      this.toast.success(msg);
    });

    this.socket.on('connect_error', () => {
      this.socket?.disconnect();
    });
  }

  public disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  public ngOnDestroy(): void {
    this.disconnect();
  }
}
