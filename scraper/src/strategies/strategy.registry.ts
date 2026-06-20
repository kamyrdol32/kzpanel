import { JobSource } from '../shared';
import { Injectable } from '@nestjs/common';

import { BulldogJobStrategy } from './bulldogjob.strategy';
import { JobScraperStrategy } from './job-scraper.strategy';
import { JustJoinITStrategy } from './justjoinit.strategy';
import { LinkedInStrategy } from './linkedin.strategy';
import { NoFluffJobsStrategy } from './nofluffjobs.strategy';
import { PracujPlStrategy } from './pracujpl.strategy';
import { TheProtocolStrategy } from './theprotocol.strategy';

/** Maps a JobSource to its strategy and exposes the full active set. */
@Injectable()
export class StrategyRegistry {
  private readonly strategies: Map<JobSource, JobScraperStrategy>;

  constructor(
    noFluff: NoFluffJobsStrategy,
    justJoin: JustJoinITStrategy,
    linkedIn: LinkedInStrategy,
    bulldog: BulldogJobStrategy,
    pracuj: PracujPlStrategy,
    theProtocol: TheProtocolStrategy,
  ) {
    this.strategies = new Map(
      [noFluff, justJoin, linkedIn, bulldog, pracuj, theProtocol].map((s) => [s.source, s]),
    );
  }

  all(): JobScraperStrategy[] {
    return [...this.strategies.values()];
  }

  get(source: JobSource): JobScraperStrategy | undefined {
    return this.strategies.get(source);
  }

  /** Returns strategies for the given sources, or all when the list is empty. */
  forSources(sources: JobSource[]): JobScraperStrategy[] {
    if (sources.length === 0) return this.all();
    return sources
      .map((s) => this.strategies.get(s))
      .filter((s): s is JobScraperStrategy => !!s);
  }
}
