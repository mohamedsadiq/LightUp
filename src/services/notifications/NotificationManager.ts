/**
 * Production-ready Notification System
 * Features: Queuing, throttling, auto-dismiss, persistence, deduplication
 */

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persistent
  persistent?: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  timestamp: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface NotificationAction {
  label: string;
  action: () => void | Promise<void>;
  style?: 'primary' | 'secondary' | 'danger';
}

interface NotificationQueue {
  notifications: Notification[];
  displayed: Set<string>;
  dismissed: Set<string>;
  throttleMap: Map<string, number>;
}

interface NotificationConfig {
  maxVisible: number;
  defaultDuration: number;
  throttleWindow: number; // ms
  persistentTypes: Array<Notification['type']>;
  maxQueueSize: number;
}

export class NotificationManager {
  private queue: NotificationQueue = {
    notifications: [],
    displayed: new Set(),
    dismissed: new Set(),
    throttleMap: new Map()
  };

  private config: NotificationConfig = {
    maxVisible: 5,
    defaultDuration: 5000,
    throttleWindow: 3000,
    persistentTypes: ['error'],
    maxQueueSize: 50
  };

  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private dismissTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: Partial<NotificationConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Add notification with deduplication and throttling
   */
  public add(notification: Omit<Notification, 'id' | 'timestamp'>): string {
    const id = this.generateId();
    const timestamp = Date.now();
    
    // Create full notification
    const fullNotification: Notification = {
      id,
      timestamp,
      duration: notification.duration ?? this.config.defaultDuration,
      priority: notification.priority ?? 'normal',
      persistent: notification.persistent ?? this.config.persistentTypes.includes(notification.type),
      ...notification
    };

    // Check for duplicates (same type + title)
    const duplicateKey = `${fullNotification.type}:${fullNotification.title}`;
    const existingIndex = this.queue.notifications.findIndex(
      (n) => `${n.type}:${n.title}` === duplicateKey
    );

    if (existingIndex !== -1) {
      // Update existing notification instead of adding new one
      const existing = this.queue.notifications[existingIndex];
      this.queue.notifications[existingIndex] = {
        ...existing,
        message: fullNotification.message, // update message/content
        timestamp, // reset timestamp (brings it to top)
      };

      // Reset auto-dismiss timer
      if (!existing.persistent && existing.duration > 0) {
        this.clearDismissTimer(existing.id);
        this.scheduleAutoDismiss(existing.id, existing.duration);
      }

      this.sortByPriority();
      this.notifyListeners();
      return existing.id;
    }

    // Add to throttle map
    this.queue.throttleMap.set(duplicateKey, timestamp);

    // Manage queue size
    if (this.queue.notifications.length >= this.config.maxQueueSize) {
      this.queue.notifications.shift(); // Remove oldest
    }

    // Add to queue with priority sorting
    this.queue.notifications.push(fullNotification);
    this.sortByPriority();

    // Auto-dismiss if not persistent
    if (!fullNotification.persistent && fullNotification.duration > 0) {
      this.scheduleAutoDismiss(id, fullNotification.duration);
    }

    this.notifyListeners();
    return id;
  }

  /**
   * Dismiss notification by ID
   */
  public dismiss(id: string): void {
    this.queue.dismissed.add(id);
    this.queue.notifications = this.queue.notifications.filter(n => n.id !== id);
    
    // Clear auto-dismiss timer
    const timer = this.dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }

    this.notifyListeners();
  }

  /**
   * Dismiss all notifications of a specific type
   */
  public dismissByType(type: Notification['type']): void {
    const toDismiss = this.queue.notifications
      .filter(n => n.type === type)
      .map(n => n.id);
    
    toDismiss.forEach(id => this.dismiss(id));
  }

  /**
   * Clear all notifications
   */
  public clear(): void {
    this.queue.notifications.forEach(n => this.dismiss(n.id));
  }

  /**
   * Get visible notifications (respects maxVisible limit)
   */
  public getVisible(): Notification[] {
    return this.queue.notifications
      .slice(0, this.config.maxVisible)
      .sort((a, b) => {
        // Sort by priority, then timestamp
        const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        return priorityDiff !== 0 ? priorityDiff : b.timestamp - a.timestamp;
      });
  }

  /**
   * Subscribe to notification changes
   */
  public subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Update notification configuration
   */
  public updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get notification statistics
   */
  public getStats() {
    return {
      total: this.queue.notifications.length,
      visible: Math.min(this.queue.notifications.length, this.config.maxVisible),
      dismissed: this.queue.dismissed.size,
      byType: this.queue.notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  // Private methods
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDuplicateKey(notification: Notification): string {
    return `${notification.type}:${notification.title}:${notification.message || ''}`;
  }

  private isDuplicate(key: string): boolean {
    const lastTime = this.queue.throttleMap.get(key);
    if (!lastTime) return false;
    
    return Date.now() - lastTime < this.config.throttleWindow;
  }

  private sortByPriority(): void {
    const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
    this.queue.notifications.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : b.timestamp - a.timestamp;
    });
  }

  private scheduleAutoDismiss(id: string, duration: number): void {
    const timer = setTimeout(() => {
      this.dismiss(id);
    }, duration);
    
    this.dismissTimers.set(id, timer);
  }

  private notifyListeners(): void {
    const visible = this.getVisible();
    this.listeners.forEach(listener => {
      try {
        listener(visible);
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });
  }

  private clearDismissTimer(id: string) {
    const timer = this.dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }
  }

  // Cleanup method
  public destroy(): void {
    this.dismissTimers.forEach(timer => clearTimeout(timer));
    this.dismissTimers.clear();
    this.listeners.clear();
    this.queue.notifications = [];
    this.queue.displayed.clear();
    this.queue.dismissed.clear();
    this.queue.throttleMap.clear();
  }
}

// Singleton instance for global use
export const notificationManager = new NotificationManager();

// Convenience methods
export const notify = {
  success: (title: string, message?: string, options?: Partial<Notification>) =>
    notificationManager.add({ type: 'success', title, message, ...options }),
  
  error: (title: string, message?: string, options?: Partial<Notification>) =>
    notificationManager.add({ type: 'error', title, message, priority: 'high', ...options }),
  
  warning: (title: string, message?: string, options?: Partial<Notification>) =>
    notificationManager.add({ type: 'warning', title, message, priority: 'normal', ...options }),
  
  info: (title: string, message?: string, options?: Partial<Notification>) =>
    notificationManager.add({ type: 'info', title, message, ...options }),
}; 