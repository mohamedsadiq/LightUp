/**
 * Production-ready Error Handling System
 * Features: Centralized capture, user-friendly messages, diagnostic logging, error recovery
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp: number;
  userAgent?: string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  type: 'client' | 'server' | 'network' | 'validation' | 'permission' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userMessage: string;
  stack?: string;
  context: ErrorContext;
  recovered: boolean;
  retryable: boolean;
}

export interface ErrorRecoveryStrategy {
  canRecover: (error: Error, context: ErrorContext) => boolean;
  recover: (error: Error, context: ErrorContext) => Promise<boolean>;
  description: string;
}

interface ErrorConfig {
  enableLogging: boolean;
  enableReporting: boolean;
  maxErrorsStored: number;
  reportingEndpoint?: string;
  enableRecovery: boolean;
}

export class ErrorManager {
  private errors: ErrorReport[] = [];
  private recoveryStrategies: ErrorRecoveryStrategy[] = [];
  private listeners: Set<(error: ErrorReport) => void> = new Set();
  private sessionId: string;

  private config: ErrorConfig = {
    enableLogging: true,
    enableReporting: false,
    maxErrorsStored: 100,
    enableRecovery: true
  };

  constructor(config?: Partial<ErrorConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
    this.registerDefaultRecoveryStrategies();
  }

  /**
   * Capture and process an error
   */
  public async captureError(
    error: Error | string,
    context: Partial<ErrorContext> = {}
  ): Promise<ErrorReport> {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const fullContext: ErrorContext = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    };

    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      type: this.classifyError(errorObj, fullContext),
      severity: this.determineSeverity(errorObj, fullContext),
      message: errorObj.message,
      userMessage: this.generateUserMessage(errorObj, fullContext),
      stack: errorObj.stack,
      context: fullContext,
      recovered: false,
      retryable: this.isRetryable(errorObj, fullContext)
    };

    // Attempt recovery
    if (this.config.enableRecovery) {
      errorReport.recovered = await this.attemptRecovery(errorObj, fullContext);
    }

    // Store error
    this.storeError(errorReport);

    // Log error
    if (this.config.enableLogging) {
      this.logError(errorReport);
    }

    // Report error
    if (this.config.enableReporting && this.config.reportingEndpoint) {
      this.reportError(errorReport);
    }

    // Notify listeners
    this.notifyListeners(errorReport);

    return errorReport;
  }

  /**
   * Register error recovery strategy
   */
  public registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }

  /**
   * Subscribe to error events
   */
  public subscribe(listener: (error: ErrorReport) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get error statistics
   */
  public getStats() {
    const now = Date.now();
    const last24h = this.errors.filter(e => now - e.context.timestamp < 24 * 60 * 60 * 1000);
    
    return {
      total: this.errors.length,
      last24h: last24h.length,
      byType: this.errors.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: this.errors.reduce((acc, e) => {
        acc[e.severity] = (acc[e.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recoveryRate: this.errors.filter(e => e.recovered).length / this.errors.length
    };
  }

  /**
   * Get recent errors
   */
  public getRecentErrors(limit: number = 10): ErrorReport[] {
    return this.errors
      .sort((a, b) => b.context.timestamp - a.context.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear stored errors
   */
  public clearErrors(): void {
    this.errors = [];
  }

  // Private methods
  private classifyError(error: Error, context: ErrorContext): ErrorReport['type'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    if (context.component === 'server' || message.includes('server')) {
      return 'server';
    }
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'client';
    }
    
    return 'unknown';
  }

  private determineSeverity(error: Error, context: ErrorContext): ErrorReport['severity'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal')) {
      return 'critical';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'high';
    }
    if (message.includes('network') || message.includes('timeout')) {
      return 'medium';
    }
    if (message.includes('validation') || message.includes('warning')) {
      return 'low';
    }
    
    return 'medium';
  }

  private generateUserMessage(error: Error, context: ErrorContext): string {
    const type = this.classifyError(error, context);
    
    const userMessages = {
      network: 'Connection issue. Please check your internet and try again.',
      permission: 'You don\'t have permission to perform this action.',
      validation: 'Please check your input and try again.',
      server: 'Server error. Please try again in a moment.',
      client: 'Something went wrong. Please refresh the page.',
      unknown: 'An unexpected error occurred. Please try again.'
    };

    return userMessages[type];
  }

  private isRetryable(error: Error, context: ErrorContext): boolean {
    const type = this.classifyError(error, context);
    return ['network', 'server'].includes(type);
  }

  private async attemptRecovery(error: Error, context: ErrorContext): Promise<boolean> {
    for (const strategy of this.recoveryStrategies) {
      if (strategy.canRecover(error, context)) {
        try {
          const recovered = await strategy.recover(error, context);
          if (recovered) {
            console.log(`Error recovered using strategy: ${strategy.description}`);
            return true;
          }
        } catch (recoveryError) {
          console.warn(`Recovery strategy failed: ${strategy.description}`, recoveryError);
        }
      }
    }
    return false;
  }

  private storeError(error: ErrorReport): void {
    this.errors.push(error);
    
    // Maintain max storage limit
    if (this.errors.length > this.config.maxErrorsStored) {
      this.errors.shift();
    }
  }

  private logError(error: ErrorReport): void {
    const logLevel = {
      low: 'info',
      medium: 'warn',
      high: 'error',
      critical: 'error'
    }[error.severity];

    (console[logLevel as keyof Console] as (...args: any[]) => void)(
      `[${error.type.toUpperCase()}] ${error.message}`,
      {
        id: error.id,
        context: error.context,
        stack: error.stack,
        recovered: error.recovered
      }
    );
  }

  private async reportError(error: ErrorReport): Promise<void> {
    if (!this.config.reportingEndpoint) return;

    try {
      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            ...error,
            stack: error.stack?.split('\n').slice(0, 10) // Limit stack trace
          }
        })
      });
    } catch (reportingError) {
      console.warn('Failed to report error:', reportingError);
    }
  }

  private notifyListeners(error: ErrorReport): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error listener failed:', listenerError);
      }
    });
  }

  private setupGlobalErrorHandlers(): void {
    // Unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        component: 'global',
        action: 'unhandled_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          component: 'global',
          action: 'unhandled_rejection'
        }
      );
    });
  }

  private registerDefaultRecoveryStrategies(): void {
    // Network retry strategy
    this.registerRecoveryStrategy({
      canRecover: (error) => error.message.toLowerCase().includes('network'),
      recover: async () => {
        // Simple connectivity check
        try {
          await fetch('/ping', { method: 'HEAD' });
          return true;
        } catch {
          return false;
        }
      },
      description: 'Network connectivity retry'
    });

    // Storage quota strategy
    this.registerRecoveryStrategy({
      canRecover: (error) => error.message.toLowerCase().includes('quota'),
      recover: async () => {
        try {
          // Clear old data
          const storage = new (await import('@plasmohq/storage')).Storage();
          await storage.clear();
          return true;
        } catch {
          return false;
        }
      },
      description: 'Storage quota cleanup'
    });
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  public destroy(): void {
    this.listeners.clear();
    this.errors = [];
    this.recoveryStrategies = [];
  }
}

// Singleton instance for global use
export const errorManager = new ErrorManager();

// Convenience methods
export const captureError = (error: Error | string, context?: Partial<ErrorContext>) =>
  errorManager.captureError(error, context);

export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  context?: Partial<ErrorContext>
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch(error => {
          captureError(error, context);
          throw error;
        });
      }
      return result;
    } catch (error) {
      captureError(error as Error, context);
      throw error;
    }
  }) as T;
}; 