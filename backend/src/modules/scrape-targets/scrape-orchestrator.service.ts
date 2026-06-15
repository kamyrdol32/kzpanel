import { ScrapedOfferDto, ScrapeRunResult } from '@evpanel/shared';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JobOffer } from '../jobs/job-offer.entity';

import { LanguageDetector } from './language.detector';
import { ScrapeTarget } from './scrape-target.entity';
import { ScraperClient } from './scraper-client.service';

/**
 * Owns scrape orchestration: loads targets, asks the stateless scraper worker
 * for RAW offers, then normalizes / parses / detects language / deduplicates /
 * persists. The scraper holds none of this — it only fetches.
 */
@Injectable()
export class ScrapeOrchestratorService {
  private readonly logger = new Logger(ScrapeOrchestratorService.name);

  constructor(
    private readonly scraper: ScraperClient,
    private readonly language: LanguageDetector,
    @InjectRepository(JobOffer)
    private readonly offers: Repository<JobOffer>,
    @InjectRepository(ScrapeTarget)
    private readonly targets: Repository<ScrapeTarget>,
  ) {}

  /** Runs all enabled targets, or a single target when targetId is given. */
  async runTargets(targetId?: string): Promise<ScrapeRunResult> {
    const where = targetId ? { id: targetId } : { enabled: true };
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
    return { targetsProcessed: targets.length, offersUpserted };
  }

  private async runForTarget(target: ScrapeTarget): Promise<number> {
    const raws = await this.scraper.scrape({
      source: target.source,
      query: target.query,
      location: target.location ?? undefined,
      remoteType: target.remoteType ?? undefined,
    });

    let count = 0;
    for (const raw of raws) {
      await this.upsert(this.normalize(raw), target.id);
      count++;
    }

    await this.targets.update(target.id, { lastRunAt: new Date() });
    this.logger.log(`${target.source} "${target.query}": ${count} offer(s) upserted`);
    return count;
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
      ...(raw.remoteType ? { remoteType: raw.remoteType } : {}),
      ...(raw.level ? { level: raw.level } : {}),
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
   * company). Collapses portal quirks like the same role published once per
   * region (different URLs) into a single offer.
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
