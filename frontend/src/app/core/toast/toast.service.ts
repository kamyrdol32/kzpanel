import { Injectable, signal } from '@angular/core';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
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

  public dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(type: ToastType, message: string, duration: number): void {
    const id = ++nextId;
    this._toasts.update((list) => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
