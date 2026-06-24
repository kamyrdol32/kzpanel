import { JobLevel, JobSource, Language, RemoteType } from '../shared';
import { Injectable, Logger } from '@nestjs/common';

import { ScrapeParams } from '../config/scrape-params';

import { JobRaw, JobScraperStrategy, JobStub } from './job-scraper.strategy';

const API_BASE = 'https://www.olx.pl/api/v1/offers';

@Injectable()
export class OlxStrategy implements JobScraperStrategy {
  readonly source = JobSource.OLX;
  private readonly logger = new Logger(OlxStrategy.name);

  private static readonly MAX_PAGES = 30;
  private static readonly PAGE_SIZE = 50;

  async fetchList(params: ScrapeParams): Promise<JobStub[]> {
    const query = (params.query ?? '').trim();
    const locationFilter = (params.location ?? '').trim().toLowerCase();

    const searchParams = new URLSearchParams({
      offset: '0',
      limit: String(OlxStrategy.PAGE_SIZE),
      category_id: '4',
      query,
    });

    if (params.remoteType === RemoteType.REMOTE) {
      searchParams.set('filter_enum_workplace[0]', 'remote_work_possibility');
    }

    const byId = new Map<string, OlxOffer>();

    try {
      for (let page = 0; page < OlxStrategy.MAX_PAGES; page++) {
        searchParams.set('offset', String(page * OlxStrategy.PAGE_SIZE));
        const url = `${API_BASE}?${searchParams.toString()}`;

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(20_000),
        });

        if (!res.ok) {
          this.logger.warn(`API returned ${res.status} on page ${page}`);
          break;
        }

        const json = (await res.json()) as OlxApiResponse;
        const offers = json.data ?? [];

        if (offers.length === 0) {
          break;
        }

        const before = byId.size;
        for (const offer of offers) {
          byId.set(String(offer.id), offer);
        }

        if (byId.size === before) {
          break;
        }

        if (!json.links?.next) {
          break;
        }
      }
    } catch (err) {
      this.logger.warn(`fetchList failed: ${(err as Error).message}`);
    }

    let offers = [...byId.values()];

    if (locationFilter) {
      offers = offers.filter((o) => {
        const city = (o.location?.city?.name ?? '').toLowerCase();
        return this.normalizePolish(city).includes(this.normalizePolish(locationFilter));
      });
    }

    this.logger.log(`"${query}"${locationFilter ? ` in "${params.location}"` : ''} → ${offers.length} offers`);

    return offers.map((offer) => ({
      externalId: String(offer.id),
      title: offer.title,
      company: this.extractUser(offer),
      sourceUrl: offer.url,
      meta: offer,
    }));
  }

  async fetchDetails(stub: JobStub): Promise<JobRaw> {
    const offer = stub.meta as OlxOffer | undefined;

    const city = offer?.location?.city?.name ?? null;
    const district = offer?.location?.district?.name ?? null;
    const location = city && district ? `${city}, ${district}` : city;
    const remoteTypes = this.mapRemote(offer);
    const levels = this.mapLevels(this.getParamLabel(offer, 'experience'));
    const salary = this.parseSalary(offer);
    const employmentTypes = this.mapEmployment(offer);
    const description = offer?.description ? this.htmlToText(offer.description) : null;

    return {
      title: stub.title,
      company: stub.company,
      sourceUrl: stub.sourceUrl,
      source: this.source,
      location,
      remoteTypes,
      levels,
      salaryMin: salary.min,
      salaryMax: salary.max,
      currency: salary.currency,
      salaryRaw: salary.raw,
      employmentTypes,
      techStack: [],
      description: description ?? undefined,
      language: Language.PL,
      publishedDate: offer?.created_time ? new Date(offer.created_time) : null,
    };
  }

  private extractUser(offer: OlxOffer): string {
    return offer.user?.company_name || offer.user?.name || 'Unknown';
  }

  private getParam(offer: OlxOffer | undefined, key: string): OlxParam | undefined {
    return offer?.params?.find((p) => p.key === key);
  }

  private getParamLabel(offer: OlxOffer | undefined, key: string): string {
    return this.getParam(offer, key)?.value?.label ?? '';
  }

  private parseSalary(offer: OlxOffer | undefined): { min: number | null; max: number | null; currency: string | null; raw: string | null } {
    const param = this.getParam(offer, 'salary');
    const visibility = this.getParam(offer, 'salary_visibility')?.value?.key;

    if (!param || visibility === 'false') {
      return { min: null, max: null, currency: null, raw: null };
    }

    const val = param.value as OlxSalaryValue | undefined;

    if (!val || typeof val.from === 'undefined') {
      return { min: null, max: null, currency: null, raw: null };
    }

    const min = val.from ?? null;
    const max = val.to ?? null;
    const currency = val.currency ?? 'PLN';
    const gross = val.gross ? 'brutto' : 'netto';
    const period = val.type === 'monthly' ? '/mies.' : '';
    const raw = min !== null ? `${min}${max && max !== min ? ` - ${max}` : ''} ${currency} ${gross}${period}`.trim() : null;

    return { min, max, currency, raw };
  }

  private mapRemote(offer: OlxOffer | undefined): RemoteType[] {
    const workplaceParam = this.getParam(offer, 'workplace');
    const keys = workplaceParam?.value?.key;
    const keyArray = Array.isArray(keys) ? keys : keys ? [keys] : [];

    if (keyArray.includes('remote_work_possibility')) {
      return [RemoteType.REMOTE];
    }
    if (keyArray.includes('hybrid_work')) {
      return [RemoteType.HYBRID];
    }
    return [RemoteType.ONSITE];
  }

  private mapEmployment(offer: OlxOffer | undefined): string[] {
    const param = this.getParam(offer, 'agreement');
    const label = param?.value?.label;

    if (!label) {
      return [];
    }

    const lower = label.toLowerCase();
    const types = new Set<string>();

    if (/umowa o prac/.test(lower)) {
      types.add('PERMANENT');
    }
    if (/b2b|samozatrudni/.test(lower)) {
      types.add('B2B');
    }
    if (/zlecenie/.test(lower)) {
      types.add('MANDATE');
    }
    if (/praktyk|sta[zż]/.test(lower)) {
      types.add('INTERNSHIP');
    }
    if (/dzie[łl]o/.test(lower)) {
      types.add('OTHER');
    }

    return [...types];
  }

  private mapLevels(experience: string): JobLevel[] {
    const lower = experience.toLowerCase();
    if (!lower || lower.includes('bez doświadczenia') || lower.includes('bez do')) {
      return [];
    }
    return [JobLevel.MID];
  }

  private htmlToText(html: string): string | null {
    const text = html
      .replace(/<\/(p|li|h[1-6]|div|br)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+\n/g, '\n')
      .trim();
    return text || null;
  }

  private normalizePolish(s: string): string {
    return s
      .replace(/[ąą]/g, 'a')
      .replace(/[ćč]/g, 'c')
      .replace(/[ęé]/g, 'e')
      .replace(/[łl]/g, 'l')
      .replace(/[ńn]/g, 'n')
      .replace(/[óo]/g, 'o')
      .replace(/[śs]/g, 's')
      .replace(/[źżz]/g, 'z');
  }
}

interface OlxApiResponse {
  data: OlxOffer[];
  links?: { next?: string };
}

interface OlxOffer {
  id: number;
  title: string;
  url: string;
  description?: string;
  created_time?: string;
  location?: {
    city?: { id?: number; name?: string };
    district?: { id?: number; name?: string };
    region?: { name?: string };
  };
  user?: {
    name?: string;
    company_name?: string;
  };
  params?: OlxParam[];
}

interface OlxParam {
  key: string;
  value?: OlxParamValue | OlxSalaryValue;
}

interface OlxParamValue {
  key?: string | string[];
  label?: string;
}

interface OlxSalaryValue {
  from?: number;
  to?: number;
  currency?: string;
  gross?: boolean;
  type?: string;
  arranged?: boolean;
  label?: string;
  key?: string;
}
