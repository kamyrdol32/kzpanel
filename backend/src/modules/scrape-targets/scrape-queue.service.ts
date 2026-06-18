import { Injectable, Logger } from '@nestjs/common';

import { ScrapeRunResult } from '../../shared';

import { ScrapeOrchestratorService } from './scrape-orchestrator.service';

interface QueueEntry {
  targetId?: string;
  resolve: (result: ScrapeRunResult) => void;
  reject: (err: unknown) => void;
}

@Injectable()
export class ScrapeQueueService {
  private readonly logger = new Logger(ScrapeQueueService.name);
  private readonly queue: QueueEntry[] = [];
  private running = false;

  constructor(private readonly orchestrator: ScrapeOrchestratorService) {}

  enqueue(targetId?: string): Promise<ScrapeRunResult> {
    return new Promise<ScrapeRunResult>((resolve, reject) => {
      this.queue.push({ targetId, resolve, reject });
      this.logger.log(`Enqueued scrape${targetId ? ` for target ${targetId}` : ' (all)'}. Queue length: ${this.queue.length}`);
      void this.drain();
    });
  }

  get queueLength(): number {
    return this.queue.length;
  }

  get isRunning(): boolean {
    return this.running;
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0) {
      const entry = this.queue.shift()!;
      try {
        this.logger.log(`Starting scrape${entry.targetId ? ` for target ${entry.targetId}` : ' (all)'}`);
        const result = await this.orchestrator.runTargets(entry.targetId);
        entry.resolve(result);
      } catch (err) {
        this.logger.error(`Scrape task failed: ${(err as Error).message}`);
        entry.reject(err);
      }
    }

    this.running = false;
  }
}
