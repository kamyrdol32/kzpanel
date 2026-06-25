import { JobSource, RemoteType } from '@kzpanel/shared';

export type FieldKey = 'query' | 'location' | 'remoteType' | 'includeAllRemote';

export interface SourceField {
  key: FieldKey;
  /** i18n key for the label */
  labelKey: string;
  type: 'text' | 'select' | 'city' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  /** options for select fields */
  options?: { value: string; label: string }[];
}

const remoteOptions = [
  { value: '', label: '—' },
  ...Object.values(RemoteType).map((r) => ({ value: r, label: r })),
];

export const SOURCE_FIELDS: Record<string, SourceField[]> = {
  [JobSource.NOFLUFFJOBS]: [
    { key: 'query', labelKey: 'scraping.fieldTech', type: 'text', required: true, placeholder: 'Angular' },
    { key: 'location', labelKey: 'scraping.location', type: 'city' },
    { key: 'remoteType', labelKey: 'scraping.remote', type: 'select', options: remoteOptions },
  ],
  [JobSource.JUSTJOINIT]: [
    { key: 'query', labelKey: 'scraping.fieldKeyword', type: 'text', required: true, placeholder: 'Angular' },
    { key: 'location', labelKey: 'scraping.location', type: 'city' },
    { key: 'remoteType', labelKey: 'scraping.remote', type: 'select', options: remoteOptions },
  ],
  [JobSource.PRACUJPL]: [
    { key: 'query', labelKey: 'scraping.fieldKeyword', type: 'text', required: true, placeholder: 'Angular' },
    { key: 'location', labelKey: 'scraping.location', type: 'city' },
  ],
  [JobSource.BULLDOGJOB]: [
    { key: 'query', labelKey: 'scraping.fieldTech', type: 'text', required: true, placeholder: 'Angular' },
    { key: 'location', labelKey: 'scraping.location', type: 'city' },
  ],
  [JobSource.THEPROTOCOL]: [
    { key: 'query', labelKey: 'scraping.fieldKeyword', type: 'text', required: true, placeholder: 'Angular' },
    { key: 'location', labelKey: 'scraping.location', type: 'city' },
  ],
  [JobSource.LINKEDIN]: [
    { key: 'query', labelKey: 'scraping.fieldKeyword', type: 'text', required: true, placeholder: 'Angular' },
    { key: 'location', labelKey: 'scraping.location', type: 'city' },
  ],
  [JobSource.OLX]: [
    { key: 'query', labelKey: 'scraping.fieldKeyword', type: 'text', required: true, placeholder: 'Angular' },
    { key: 'location', labelKey: 'scraping.location', type: 'city' },
    { key: 'remoteType', labelKey: 'scraping.remote', type: 'select', options: remoteOptions },
  ],
};

/** Sources that can be scraped (excludes MANUAL). */
export const SCRAPEABLE_SOURCES = Object.values(JobSource).filter(
  (s) => s !== JobSource.MANUAL,
);
