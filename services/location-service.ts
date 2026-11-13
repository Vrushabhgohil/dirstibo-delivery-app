import * as Location from 'expo-location';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const locationService = {
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      return fgStatus === 'granted';
    } catch (err) {
      console.warn('Location permission request error:', err);
      return false;
    }
  },

  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
    } catch (err) {
      console.warn('Error fetching device GPS location:', err);
      return null;
    }
  },

  async recordDeliveryLocationPing(params: {
    deliveryPersonId: string;
    latitude: number;
    longitude: number;
    status: 'online' | 'travelling' | 'on_visit' | 'idle' | 'offline';
    storeId?: string;
  }): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      // Record in location_history if available
      await supabase.from('location_history').insert([
        {
          latitude: params.latitude,
          longitude: params.longitude,
          status: params.status,
          store_id: params.storeId || null,
          recorded_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      // Silent catch for background location pings
    }
  },
};

