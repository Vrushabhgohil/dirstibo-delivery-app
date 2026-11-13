import React, { createContext, useContext, useState, useEffect } from 'react';
import { offlineStorage } from '@/lib/offline-storage';
import { OfflineQueueItem } from '@/types';
import { deliveryService } from '@/services/delivery-service';

interface OfflineSyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  queue: OfflineQueueItem[];
  triggerSync: () => Promise<void>;
  enqueueAction: (action: OfflineQueueItem['action'], payload: any) => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);

  const loadQueue = async () => {
    const q = await offlineStorage.getOfflineQueue();
    setQueue(q);
  };

  useEffect(() => {
    loadQueue();

    // Check connectivity periodically or on network events
    const checkNetwork = async () => {
      try {
        const res = await fetch('https://qdadspfomzgtvqgbzzri.supabase.co/rest/v1/', {
          method: 'HEAD',
        });
        const online = res.status < 500;
        setIsOnline(online);
        if (online) {
          triggerSync();
        }
      } catch {
        setIsOnline(false);
      }
    };

    const interval = setInterval(checkNetwork, 15000);
    checkNetwork();

    return () => clearInterval(interval);
  }, []);

  const triggerSync = async (): Promise<void> => {
    const currentQueue = await offlineStorage.getOfflineQueue();
    if (currentQueue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    for (const item of currentQueue) {
      if (item.status === 'syncing') continue;

      await offlineStorage.updateQueueItemStatus(item.id, 'syncing');
      try {
        if (item.action === 'CONFIRM_PICKUP') {
          await deliveryService.confirmPickup(item.payload);
        } else if (item.action === 'START_DELIVERY') {
          await deliveryService.startDelivery(item.payload);
        } else if (item.action === 'COMPLETE_DELIVERY' || item.action === 'RECORD_PARTIAL_DELIVERY') {
          await deliveryService.completeDelivery(item.payload);
        }
        await offlineStorage.removeFromOfflineQueue(item.id);
      } catch (err: any) {
        console.warn(`Sync failed for item ${item.id}:`, err);
        await offlineStorage.updateQueueItemStatus(item.id, 'failed', err?.message || 'Sync failed');
      }
    }

    await loadQueue();
    setIsSyncing(false);
  };

  const enqueueAction = async (action: OfflineQueueItem['action'], payload: any): Promise<void> => {
    await offlineStorage.addToOfflineQueue({ action, payload });
    await loadQueue();
  };

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount: queue.length,
        queue,
        triggerSync,
        enqueueAction,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
};

export const useOfflineSync = (): OfflineSyncContextType => {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
  }
  return context;
};
