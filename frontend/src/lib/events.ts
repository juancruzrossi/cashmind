type EventCallback = () => void;

class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string) {
    this.listeners.get(event)?.forEach(callback => callback());
  }
}

export const events = new EventEmitter();

export const EVENTS = {
  TRANSACTION_CHANGED: 'transaction:changed',
  PAYSLIP_CHANGED: 'payslip:changed',
} as const;
