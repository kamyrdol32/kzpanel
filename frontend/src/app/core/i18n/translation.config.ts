import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModuleConfig } from '@ngx-translate/core';
import { forkJoin, map, Observable } from 'rxjs';

/** Namespaces matching assets/i18n/{lang}/*.json */
const NAMESPACES = ['common', 'auth', 'jobs', 'recruitment', 'scraping'] as const;

/**
 * Merges one or more namespace bundles for a language. The root config loads all
 * namespaces; a lazy feature can instead instantiate this with just its own
 * namespace (+ common) and register via TranslateModule.forChild({ extend: true }).
 */
export class ModuleTranslateLoader implements TranslateLoader {
  constructor(
    private readonly http: HttpClient,
    private readonly modules: readonly string[],
  ) {}

  getTranslation(lang: string): Observable<Record<string, unknown>> {
    const requests = this.modules.map((m) =>
      this.http.get<Record<string, unknown>>(`/assets/i18n/${lang}/${m}.json`),
    );
    return forkJoin(requests).pipe(
      map((bundles) => bundles.reduce((acc, b) => ({ ...acc, ...b }), {})),
    );
  }
}

export function provideTranslation(): TranslateModuleConfig {
  return {
    defaultLanguage: 'pl',
    loader: {
      provide: TranslateLoader,
      useFactory: (http: HttpClient) => new ModuleTranslateLoader(http, NAMESPACES),
      deps: [HttpClient],
    },
  };
}
