import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ApiService } from '../../core/http/api.service';

interface PublicStats {
  scrapers: number;
  offers: number;
  companies: number;
  sources: number;
}

interface StatCard {
  icon: string;
  labelKey: string;
  target: number;
}

@Component({
  selector: 'kz-landing',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
})
export class LandingPage implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);

  protected readonly cards = signal<StatCard[]>([]);
  protected readonly display = signal<number[]>([]);

  private rafId = 0;

  public ngOnInit(): void {
    this.api.get<PublicStats>('/public/stats').subscribe({
      next: (stats) => this.initCards(stats),
      error: () => this.initCards({ scrapers: 0, offers: 0, companies: 0, sources: 0 }),
    });
  }

  public ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
  }

  private initCards(stats: PublicStats): void {
    const cards: StatCard[] = [
      { icon: 'travel_explore', labelKey: 'landing.stats.scrapers', target: stats.scrapers },
      { icon: 'work', labelKey: 'landing.stats.offers', target: stats.offers },
      { icon: 'apartment', labelKey: 'landing.stats.companies', target: stats.companies },
      { icon: 'hub', labelKey: 'landing.stats.sources', target: stats.sources },
    ];
    this.cards.set(cards);
    this.display.set(cards.map(() => 0));
    this.animate(cards.map((card) => card.target));
  }

  private animate(targets: number[]): void {
    const duration = 1600;
    let startTs = 0;

    const step = (ts: number): void => {
      if (startTs === 0) {
        startTs = ts;
      }
      const progress = Math.min(1, (ts - startTs) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.display.set(targets.map((target) => Math.round(target * eased)));

      if (progress < 1) {
        this.rafId = requestAnimationFrame(step);
      }
    };

    this.rafId = requestAnimationFrame(step);
  }
}
