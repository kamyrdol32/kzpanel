import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

import { ScrapeRunResult } from '../../shared';

export interface ScrapeCompletedPayload extends ScrapeRunResult {
  userId: string | null;
}

@WebSocketGateway({ cors: { origin: '*' }, path: '/ws' })
export class NotificationsGateway {
  @WebSocketServer()
  private readonly server!: Server;

  public emitScrapeCompleted(payload: ScrapeCompletedPayload): void {
    this.server.emit('scrape:completed', payload);
  }
}
