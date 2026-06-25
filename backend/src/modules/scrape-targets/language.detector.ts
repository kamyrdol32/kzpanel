import { Language } from '../../shared';
import { Injectable } from '@nestjs/common';

const PL_STOPWORDS = [' i ', ' oraz ', ' praca ', ' wymagania ', ' obowiązki ', ' znajomość '];

@Injectable()
export class LanguageDetector {
  detect(text: string): Language {
    const lower = ` ${text.toLowerCase()} `;
    const hasPlChars = /[ąćęłńóśźż]/.test(lower);
    const hasPlWords = PL_STOPWORDS.some((w) => lower.includes(w));
    return hasPlChars || hasPlWords ? Language.PL : Language.EN;
  }
}
