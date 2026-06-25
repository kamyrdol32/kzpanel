import { ScrapedOfferDto, ScrapeRunResult } from '../../shared';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JobOffer } from '../jobs/job-offer.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';

import { LanguageDetector } from './language.detector';
import { ScrapeTarget } from './scrape-target.entity';
import { ScraperClient } from './scraper-client.service';

@Injectable()
export class ScrapeOrchestratorService {
  private readonly logger = new Logger(ScrapeOrchestratorService.name);

  constructor(
    private readonly scraper: ScraperClient,
    private readonly language: LanguageDetector,
    private readonly gateway: NotificationsGateway,
    @InjectRepository(JobOffer)
    private readonly offers: Repository<JobOffer>,
    @InjectRepository(ScrapeTarget)
    private readonly targets: Repository<ScrapeTarget>,
  ) {}

  async runTargets(opts: { targetId?: string; userId?: string } = {}): Promise<ScrapeRunResult> {
    const where = opts.targetId
      ? { id: opts.targetId }
      : opts.userId
        ? { enabled: true, userId: opts.userId }
        : { enabled: true };
    const targets = await this.targets.find({ where });
    this.logger.log(`Scrape run — ${targets.length} target(s)`);

    let offersUpserted = 0;
    for (const target of targets) {
      offersUpserted += await this.runForTarget(target).catch((err) => {
        this.logger.error(
          `Target ${target.source}/${target.query} failed: ${(err as Error).message}`,
        );
        return 0;
      });
    }

    const result: ScrapeRunResult = { targetsProcessed: targets.length, offersUpserted };
    this.gateway.emitScrapeCompleted({ ...result, userId: opts.userId ?? null });
    return result;
  }

  private async runForTarget(target: ScrapeTarget): Promise<number> {
    const raws = await this.scraper.scrape({
      source: target.source,
      query: target.query,
      location: target.location ?? undefined,
      remoteType: target.remoteType ?? undefined,
      includeAllRemote: target.includeAllRemote,
    });

    let count = 0;
    const seenUrls: string[] = [];
    for (const raw of raws) {
      try {
        await this.upsert(this.normalize(raw), target.id);
        seenUrls.push(raw.sourceUrl);
        count++;
      } catch (err) {
        this.logger.warn(
          `${target.source} "${target.query}" — skipped offer ${raw.sourceUrl}: ${(err as Error).message}`,
        );
      }
    }

    if (seenUrls.length > 0) {
      const pruned = await this.pruneStale(target.id, seenUrls);
      if (pruned > 0) {
        this.logger.log(`${target.source} "${target.query}": pruned ${pruned} stale offer(s)`);
      }
    }

    await this.targets.update(target.id, { lastRunAt: new Date() });
    this.logger.log(`${target.source} "${target.query}": ${count} offer(s) upserted`);
    return count;
  }

  private async pruneStale(scrapeTargetId: string, keepUrls: string[]): Promise<number> {
    const res = await this.offers
      .createQueryBuilder()
      .update(JobOffer)
      .set({ staleAt: new Date() })
      .where('scrapeTargetId = :scrapeTargetId', { scrapeTargetId })
      .andWhere('sourceUrl NOT IN (:...keepUrls)', { keepUrls })
      .andWhere('staleAt IS NULL')
      .execute();
    return res.affected ?? 0;
  }

  private normalize(raw: ScrapedOfferDto): Partial<JobOffer> {
    const language =
      raw.language ?? this.language.detect(`${raw.title} ${raw.description ?? ''}`);
    const salary = this.parseSalary(raw.salaryRaw);
    return {
      title: raw.title.trim(),
      company: raw.company.trim(),
      sourceUrl: raw.sourceUrl,
      source: raw.source,
      description: raw.description ?? null,
      salaryMin: raw.salaryMin ?? salary.min,
      salaryMax: raw.salaryMax ?? salary.max,
      currency: raw.currency ?? salary.currency,
      location: raw.location ?? null,
      remoteTypes: raw.remoteTypes ?? [],
      levels: raw.levels ?? [],
      employmentTypes: raw.employmentTypes ?? [],
      techStack: raw.techStack ?? [],
      requirements: raw.requirements ?? [],
      mustHave: raw.mustHave ?? [],
      niceToHave: raw.niceToHave ?? [],
      benefits: raw.benefits ?? [],
      responsibilities: raw.responsibilities ?? [],
      language,
      publishedDate: raw.publishedDate ? new Date(raw.publishedDate) : null,
    };
  }

  private parseSalary(raw?: string | null): {
    min: number | null;
    max: number | null;
    currency: string | null;
  } {
    if (!raw) {
      return { min: null, max: null, currency: null };
    }
    const numbers = (raw.match(/\d[\d\s.]*\d|\d/g) ?? [])
      .map((n) => parseInt(n.replace(/[\s.]/g, ''), 10))
      .filter((n) => !Number.isNaN(n));
    const currency = raw.match(/PLN|EUR|USD|GBP/i)?.[0]?.toUpperCase() ?? null;
    return {
      min: numbers[0] ?? null,
      max: numbers[1] ?? numbers[0] ?? null,
      currency,
    };
  }

  private async upsert(data: Partial<JobOffer>, scrapeTargetId: string): Promise<void> {
    const payload = { ...data, scrapeTargetId };
    const existing = await this.offers
      .createQueryBuilder('o')
      .where('o.scrapeTargetId = :scrapeTargetId', { scrapeTargetId })
      .andWhere('o.sourceUrl = :sourceUrl', { sourceUrl: data.sourceUrl })
      .getOne();

    if (existing) {
      await this.offers.update(existing.id, { ...payload, staleAt: null });
    } else {
      await this.offers.insert(this.offers.create({ ...payload, staleAt: null }));
    }
  }
}
