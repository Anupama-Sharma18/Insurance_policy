import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'humanize', standalone: true })
export class HumanizePipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return '—';
    return String(value)
      .replace(/[_-]+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, character => character.toUpperCase());
  }
}
