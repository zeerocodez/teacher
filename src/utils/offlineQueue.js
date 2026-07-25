/**
 * Resilient Offline Telemetry Queue Utility
 * Queues telemetry events and telemetry data in LocalStorage when offline, 
 * and automatically flushes queued payload when back online.
 */

const STORAGE_KEY = 'eduvista_offline_queue_v1';

export function enqueueOfflinePayload(actionType, payload) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push({
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actionType,
      payload,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    console.log(`[OfflineQueue] Enqueued action "${actionType}". Total queued: ${existing.length}`);
  } catch (e) {
    console.warn('[OfflineQueue] Failed to enqueue payload:', e);
  }
}

export async function flushOfflineQueue(sendHandler) {
  try {
    const queue = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (queue.length === 0) return;

    console.log(`[OfflineQueue] Flushing ${queue.length} queued offline actions...`);
    const remaining = [];

    for (const item of queue) {
      try {
        if (typeof sendHandler === 'function') {
          await sendHandler(item);
        }
      } catch (err) {
        console.warn(`[OfflineQueue] Item ${item.id} failed processing, keeping in queue:`, err);
        remaining.push(item);
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  } catch (e) {
    console.warn('[OfflineQueue] Error flushing queue:', e);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineQueue] Device came back online. Flushing queued requests...');
    flushOfflineQueue();
  });
}
