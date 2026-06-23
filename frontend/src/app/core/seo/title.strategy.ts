import { DOCUMENT } from '@angular/common';
import { inject, Injectable, Injector } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  TitleStrategy,
} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

const SITE = 'KŻ Panel';

/**
 * Sets a per-route document title and description (from route `data.titleKey` /
 * `data.descriptionKey`, translated) and keeps the canonical / og:url in sync
 * with the current address. Re-applies on language change.
 *
 * TranslateService is resolved lazily (via Injector) the first time a title is
 * applied — injecting it in the constructor would pull HttpClient → the HTTP
 * interceptors → Router, while Router itself constructs this strategy, which
 * Angular rejects as a circular dependency.
 */
@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  private translate?: TranslateService;
  private subscribed = false;
  private lastSnapshot?: RouterStateSnapshot;

  private get t(): TranslateService {
    if (!this.translate) {
      this.translate = this.injector.get(TranslateService);
      if (!this.subscribed) {
        this.subscribed = true;
        this.translate.onLangChange.subscribe(() => {
          if (this.lastSnapshot) {
            this.updateTitle(this.lastSnapshot);
          }
        });
      }
    }
    return this.translate;
  }

  public override updateTitle(snapshot: RouterStateSnapshot): void {
    this.lastSnapshot = snapshot;
    const data = this.deepestData(snapshot.root);

    const titleKey = data['titleKey'] as string | undefined;
    const pageTitle = titleKey ? this.t.instant(titleKey) : '';
    this.title.setTitle(pageTitle ? `${pageTitle} · ${SITE}` : SITE);

    const descKey = data['descriptionKey'] as string | undefined;
    if (descKey) {
      const desc = this.t.instant(descKey);
      this.meta.updateTag({ name: 'description', content: desc });
      this.meta.updateTag({ property: 'og:description', content: desc });
    }

    const url = this.doc.location.origin + this.doc.location.pathname;
    this.meta.updateTag({ property: 'og:url', content: url });
    let canonical = this.doc.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = this.doc.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }

  private deepestData(route: ActivatedRouteSnapshot): Record<string, unknown> {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current.data;
  }
}
