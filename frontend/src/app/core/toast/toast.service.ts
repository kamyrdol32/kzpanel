import { Injectable, signal } from '@angular/core';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  /** Pre-sanitized rich content rendered via innerHTML. Use only with trusted, static strings. */
  html?: string;
}

let nextId = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  public readonly toasts = this._toasts.asReadonly();

  public info(message: string, duration = 4000): void {
    this.push('info', message, duration);
  }

  public success(message: string, duration = 4000): void {
    this.push('success', message, duration);
  }

  public warning(message: string, duration = 5000): void {
    this.push('warning', message, duration);
  }

  public error(message: string, duration = 6000): void {
    this.push('error', message, duration);
  }

  public infoHtml(html: string, duration = 6000): void {
    this.push('info', '', duration, html);
  }

  public dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(type: ToastType, message: string, duration: number, html?: string): void {
    const id = ++nextId;
    this._toasts.update((list) => [...list, { id, type, message, html }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
