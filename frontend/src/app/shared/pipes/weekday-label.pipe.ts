import { Pipe, PipeTransform } from '@angular/core';

const WEEKDAY_KEYS: readonly string[] = [
  'scraping.weekdaySun',
  'scraping.weekdayMon',
  'scraping.weekdayTue',
  'scraping.weekdayWed',
  'scraping.weekdayThu',
  'scraping.weekdayFri',
  'scraping.weekdaySat',
];

@Pipe({ name: 'weekdayLabel', standalone: true })
export class WeekdayLabelPipe implements PipeTransform {
  public transform(day: number): string {
    return WEEKDAY_KEYS[day] ?? '';
  }
}
