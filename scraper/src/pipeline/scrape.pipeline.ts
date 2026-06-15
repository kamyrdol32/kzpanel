import { JobSource, ScrapeRunResult } from '@evpanel/shared';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ScrapeParams } from '../config/scrape-params';
import { ScraperConfig } from '../config/scraper.config';
import { JobOffer } from '../persistence/job-offer.entity';
import { ScrapeTarget } from '../persistence/scrape-target.entity';
import { JobRaw } from '../strategies/job-scraper.strategy';
import { StrategyRegistry } from '../strategies/strategy.registry';

import { LanguageDetector } from './language.detector';

/**
 * Target-driven scraping pipeline. Reads `scrape_targets` from the DB (managed in
 * the panel) and for each runs the matching strategy:
 *   1. list  2. normalize  3. details  4. detect language  5. AI (stub)  6. persist  7. upsert
 * Dedup is guaranteed by the unique (source, sourceUrl) index — existing offers
 * are updated in place, never duplicated.
 */
@Injectable()
export class ScrapePipeline {
  private readonly logger = new Logger(ScrapePipeline.name);

  constructor(
    private readonly registry: StrategyRegistry,
    private readonly language: LanguageDetector,
    private readonly config: ScraperConfig,
    @InjectRepository(JobOffer)
    private readonly offers: Repository<JobOffer>,
    @InjectRepository(ScrapeTarget)
    private readonly targets: Repository<ScrapeTarget>,
  ) {}

  /** Runs all enabled targets, or a single target when targetId is given. */
  async runTargets(targetId?: string): Promise<ScrapeRunResult> {
    const where = targetId ? { id: targetId } : { enabled: true };
    const targets = await this.targets.find({ where });
    this.logger.log(`Run start — ${targets.length} target(s), mock=${this.config.mock}`);

    let offersUpserted = 0;
    for (const target of targets) {
      offersUpserted += await this.runForTarget(target).catch((err) => {
        this.logger.error(`Target ${target.source}/${target.query} failed: ${(err as Error).message}`);
        return 0;
      });
    }
    return { targetsProcessed: targets.length, offersUpserted };
  }

  private async runForTarget(target: ScrapeTarget): Promise<number> {
    const params: ScrapeParams = {
      query: target.query,
      location: target.location ?? undefined,
      remoteType: target.remoteType ?? undefined,
      limit: this.config.params.limit,
    };

    let count = 0;
    if (this.config.mock) {
      await this.upsert(this.normalize(this.synthetic(target.source, params)), target.id);
      count = 1;
    } else {
      const strategy = this.registry.get(target.source);
      if (!strategy) {
        this.logger.warn(`No strategy registered for ${target.source}`);
      } else {
        const stubs = await strategy.fetchList(params); // 1
        this.logger.log(`${target.source} "${target.query}": ${stubs.length} listings`);
        for (const stub of stubs) {
          const raw = await strategy.fetchDetails(stub); // 3
          await this.upsert(this.normalize(raw), target.id); // 2 + 4 + 6 + 7
          count++;
        }
      }
    }

    await this.targets.update(target.id, { lastRunAt: new Date() });
    return count;
  }

  private synthetic(source: JobSource, params: ScrapeParams): JobRaw {
    const q = params.query ?? 'Developer';
    return {
      title: `${q} Developer`,
      company: 'Mock Company',
      sourceUrl: `mock://${source}/${encodeURIComponent(q)}-${encodeURIComponent(params.location ?? 'any')}`,
      source,
      description: `Synthetic ${q} offer for testing the pipeline.`,
      location: params.location ?? null,
      techStack: [q],
    };
  }

  private normalize(raw: JobRaw): Partial<JobOffer> {
    const language =
      raw.language ?? this.language.detect(`${raw.title} ${raw.description ?? ''}`); // 4
    const salary = this.parseSalary(raw.salaryRaw);
    // 5. AI analysis would enrich here (currently skipped — no provider).
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
      ...(raw.remoteType ? { remoteType: raw.remoteType } : {}),
      ...(raw.level ? { level: raw.level } : {}),
      techStack: raw.techStack ?? [],
      requirements: raw.requirements ?? [],
      mustHave: raw.mustHave ?? [],
      niceToHave: raw.niceToHave ?? [],
      benefits: raw.benefits ?? [],
      responsibilities: raw.responsibilities ?? [],
      language,
      publishedDate: raw.publishedDate ?? null,
    };
  }

  /** Extracts {min,max,currency} from raw salary text like "18 000 - 24 000 PLN". */
  private parseSalary(raw?: string | null): {
    min: number | null;
    max: number | null;
    currency: string | null;
  } {
    if (!raw) return { min: null, max: null, currency: null };
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

  /**
   * Insert new or update existing, deduplicating by normalized (source, title,
   * company). This collapses portal quirks like NoFluffJobs publishing the same
   * role once per region (different URLs) into a single offer.
   */
  private async upsert(data: Partial<JobOffer>, scrapeTargetId: string): Promise<void> {
    const payload = { ...data, scrapeTargetId };
    const existing = await this.offers
      .createQueryBuilder('o')
      .where('o.source = :source', { source: data.source })
      .andWhere('LOWER(o.title) = LOWER(:title)', { title: data.title })
      .andWhere('LOWER(o.company) = LOWER(:company)', { company: data.company })
      .getOne();

    if (existing) {
      await this.offers.update(existing.id, payload);
    } else {
      await this.offers.insert(this.offers.create(payload));
    }
  }
}
