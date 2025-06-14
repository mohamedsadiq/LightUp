/**
 * Production-ready Save Workflow System
 * Features: Debouncing, optimistic updates, retry logic, conflict resolution
 */

import { Storage } from "@plasmohq/storage";
import type { Settings } from "~types/settings";

export type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

export interface SaveResult {
  success: boolean;
  error?: string;
  conflictData?: any;
  timestamp: number;
}

export interface SaveOptions {
  debounceMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  optimistic?: boolean;
  validateBeforeSave?: (data: any) => Promise<boolean> | boolean;
  onConflict?: (local: any, remote: any) => any;
}

interface SaveOperation {
  id: string;
  data: any;
  timestamp: number;
  retryCount: number;
  resolve: (result: SaveResult) => void;
  reject: (error: Error) => void;
}

export class SaveManager {
  private storage: Storage;
  private saveState: SaveState = 'idle';
  private debounceTimer: NodeJS.Timeout | null = null;
  private pendingOperations: Map<string, SaveOperation> = new Map();
  private lastSavedData: string = '';
  private lastSavedTimestamp: number = 0;
  private listeners: Set<(state: SaveState, error?: string) => void> = new Set();

  private defaultOptions: Required<SaveOptions> = {
    debounceMs: 1000,
    maxRetries: 3,
    retryDelayMs: 1000,
    optimistic: true,
    validateBeforeSave: () => true,
    onConflict: (local, remote) => local // Prefer local by default
  };

  constructor(storage?: Storage) {
    this.storage = storage || new Storage();
  }

  /**
   * Save data with debouncing and retry logic
   */
  public async save(
    key: string,
    data: any,
    options: SaveOptions = {}
  ): Promise<SaveResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const operationId = this.generateOperationId();
    
    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    return new Promise<SaveResult>((resolve, reject) => {
      // Store operation
      const operation: SaveOperation = {
        id: operationId,
        data,
        timestamp: Date.now(),
        retryCount: 0,
        resolve,
        reject
      };

      this.pendingOperations.set(operationId, operation);

      // Debounced save
      this.debounceTimer = setTimeout(async () => {
        await this.executeSave(key, operation, mergedOptions);
      }, mergedOptions.debounceMs);
    });
  }

  /**
   * Save immediately without debouncing
   */
  public async saveImmediate(
    key: string,
    data: any,
    options: SaveOptions = {}
  ): Promise<SaveResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const operationId = this.generateOperationId();

    return new Promise<SaveResult>((resolve, reject) => {
      const operation: SaveOperation = {
        id: operationId,
        data,
        timestamp: Date.now(),
        retryCount: 0,
        resolve,
        reject
      };

      this.executeSave(key, operation, mergedOptions);
    });
  }

  /**
   * Get current save state
   */
  public getState(): SaveState {
    return this.saveState;
  }

  /**
   * Check if there are unsaved changes
   */
  public hasUnsavedChanges(currentData: any): boolean {
    const currentDataString = JSON.stringify(currentData);
    return currentDataString !== this.lastSavedData;
  }

  /**
   * Subscribe to save state changes
   */
  public subscribe(listener: (state: SaveState, error?: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Cancel pending save operations
   */
  public cancelPending(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.pendingOperations.forEach(operation => {
      operation.reject(new Error('Save operation cancelled'));
    });
    this.pendingOperations.clear();
    
    this.setState('idle');
  }

  /**
   * Get save statistics
   */
  public getStats() {
    return {
      state: this.saveState,
      pendingOperations: this.pendingOperations.size,
      lastSaved: this.lastSavedTimestamp,
      hasUnsavedChanges: this.lastSavedData !== ''
    };
  }

  // Private methods
  private async executeSave(
    key: string,
    operation: SaveOperation,
    options: Required<SaveOptions>
  ): Promise<void> {
    try {
      this.setState('saving');

      // Validation
      const isValid = await options.validateBeforeSave(operation.data);
      if (!isValid) {
        throw new Error('Data validation failed');
      }

      // Check for conflicts (compare timestamps)
      const existingData = await this.storage.get(key);
      if (existingData && this.hasConflict(existingData, operation)) {
        const resolvedData = options.onConflict(operation.data, existingData);
        operation.data = resolvedData;
        this.setState('conflict');
      }

      // Optimistic update
      if (options.optimistic) {
        this.updateLocalState(operation.data);
      }

      // Perform save
      await this.storage.set(key, {
        ...operation.data,
        _timestamp: Date.now(),
        _version: this.generateVersion()
      });

      // Update tracking
      this.lastSavedData = JSON.stringify(operation.data);
      this.lastSavedTimestamp = Date.now();

      // Notify success
      const result: SaveResult = {
        success: true,
        timestamp: this.lastSavedTimestamp
      };

      operation.resolve(result);
      this.pendingOperations.delete(operation.id);
      this.setState('saved');

      // Auto-reset to idle after 2 seconds
      setTimeout(() => {
        if (this.saveState === 'saved') {
          this.setState('idle');
        }
      }, 2000);

    } catch (error) {
      await this.handleSaveError(key, operation, options, error as Error);
    }
  }

  private async handleSaveError(
    key: string,
    operation: SaveOperation,
    options: Required<SaveOptions>,
    error: Error
  ): Promise<void> {
    operation.retryCount++;

    if (operation.retryCount <= options.maxRetries) {
      // Retry with exponential backoff
      const delay = options.retryDelayMs * Math.pow(2, operation.retryCount - 1);
      
      setTimeout(() => {
        this.executeSave(key, operation, options);
      }, delay);
      
      return;
    }

    // Max retries exceeded
    const result: SaveResult = {
      success: false,
      error: error.message,
      timestamp: Date.now()
    };

    operation.resolve(result);
    this.pendingOperations.delete(operation.id);
    this.setState('error', error.message);
  }

  private hasConflict(existingData: any, operation: SaveOperation): boolean {
    if (!existingData._timestamp) return false;
    return existingData._timestamp > operation.timestamp;
  }

  private updateLocalState(data: any): void {
    // Optimistic update - could trigger UI updates here
    this.lastSavedData = JSON.stringify(data);
  }

  private setState(state: SaveState, error?: string): void {
    this.saveState = state;
    this.notifyListeners(state, error);
  }

  private notifyListeners(state: SaveState, error?: string): void {
    this.listeners.forEach(listener => {
      try {
        listener(state, error);
      } catch (err) {
        console.error('Save state listener error:', err);
      }
    });
  }

  private generateOperationId(): string {
    return `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVersion(): string {
    return Date.now().toString(36);
  }

  // Cleanup
  public destroy(): void {
    this.cancelPending();
    this.listeners.clear();
  }
}

// Singleton instance for global use
export const saveManager = new SaveManager(); 