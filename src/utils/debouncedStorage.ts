import { Storage } from "@plasmohq/storage";

/**
 * Debounced storage utility to batch writes and reduce jank
 * Collapses multiple rapid writes into a single operation
 */

type DebouncedWrite = {
  key: string;
  value: any;
  timestamp: number;
};

const DEFAULT_DEBOUNCE_MS = 300;

// Per-key debounced writes
const pendingWrites = new Map<string, DebouncedWrite>();
const writeTimers = new Map<string, NodeJS.Timeout>();

/**
 * Debounced set operation - collapses multiple rapid writes to the same key
 * @param key - Storage key
 * @param value - Value to store
 * @param debounceMs - Debounce delay (default: 300ms)
 */
export const debouncedSet = async (
  key: string,
  value: any,
  debounceMs: number = DEFAULT_DEBOUNCE_MS
): Promise<void> => {
  // Store the latest value
  pendingWrites.set(key, { key, value, timestamp: Date.now() });

  // Clear existing timer for this key
  const existingTimer = writeTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Schedule new write
  const timer = setTimeout(async () => {
    const pending = pendingWrites.get(key);
    if (!pending) return;

    // Verify this is still the latest write
    const latest = pendingWrites.get(key);
    if (latest && latest.timestamp === pending.timestamp) {
      const storage = new Storage();
      await storage.set(key, pending.value);
      pendingWrites.delete(key);
      writeTimers.delete(key);
    }
  }, debounceMs);

  writeTimers.set(key, timer);
};

/**
 * Immediate set operation - bypasses debounce for critical writes
 * @param key - Storage key
 * @param value - Value to store
 */
export const immediateSet = async (key: string, value: any): Promise<void> => {
  // Cancel any pending debounced write for this key
  const existingTimer = writeTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
    writeTimers.delete(key);
  }
  pendingWrites.delete(key);

  const storage = new Storage();
  await storage.set(key, value);
};

/**
 * Flush all pending writes immediately
 * Useful before page unload or critical operations
 */
export const flushPendingWrites = async (): Promise<void> => {
  const promises: Promise<void>[] = [];

  for (const [key, timer] of writeTimers.entries()) {
    clearTimeout(timer);
    const pending = pendingWrites.get(key);
    if (pending) {
      promises.push(immediateSet(key, pending.value));
    }
  }

  await Promise.all(promises);
};

/**
 * Cancel all pending writes without executing them
 */
export const cancelPendingWrites = (): void => {
  for (const timer of writeTimers.values()) {
    clearTimeout(timer);
  }
  writeTimers.clear();
  pendingWrites.clear();
};

// Flush pending writes before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushPendingWrites().catch(console.error);
  });
}

export default {
  debouncedSet,
  immediateSet,
  flushPendingWrites,
  cancelPendingWrites
};
