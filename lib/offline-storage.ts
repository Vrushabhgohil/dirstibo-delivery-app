import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeliveryAssignment, Order, OfflineQueueItem } from '@/types';

const STORAGE_KEYS = {
  DELIVERIES: '@distribo_cached_deliveries',
  ORDERS: '@distribo_cached_orders',
  OFFLINE_QUEUE: '@distribo_delivery_offline_queue',
  PROFILE: '@distribo_delivery_profile',
};

export const offlineStorage = {
  // Save assigned deliveries to cache
  async saveDeliveries(deliveries: DeliveryAssignment[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries));
    } catch (err) {
      console.warn('Error saving deliveries to offline cache:', err);
    }
  },

  // Retrieve assigned deliveries from cache
  async getDeliveries(): Promise<DeliveryAssignment[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DELIVERIES);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.warn('Error reading deliveries from offline cache:', err);
      return [];
    }
  },

  // Save specific order details to cache
  async saveOrder(order: Order): Promise<void> {
    try {
      const allOrders = await this.getAllCachedOrders();
      const filtered = allOrders.filter((o) => o.id !== order.id);
      filtered.push(order);
      await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(filtered));
    } catch (err) {
      console.warn('Error caching order:', err);
    }
  },

  // Get cached order
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const all = await this.getAllCachedOrders();
      return all.find((o) => o.id === orderId) || null;
    } catch {
      return null;
    }
  },

  async getAllCachedOrders(): Promise<Order[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // OFFLINE QUEUE MANAGEMENT
  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async addToOfflineQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'status'>): Promise<OfflineQueueItem> {
    const queue = await this.getOfflineQueue();
    const newItem: OfflineQueueItem = {
      ...item,
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      status: 'pending',
    };
    queue.push(newItem);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    return newItem;
  },

  async removeFromOfflineQueue(id: string): Promise<void> {
    const queue = await this.getOfflineQueue();
    const updated = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(updated));
  },

  async updateQueueItemStatus(id: string, status: 'pending' | 'syncing' | 'failed', error?: string): Promise<void> {
    const queue = await this.getOfflineQueue();
    const index = queue.findIndex((item) => item.id === id);
    if (index >= 0) {
      queue[index].status = status;
      if (error) queue[index].error = error;
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    }
  },

  async clearOfflineQueue(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  },
};

