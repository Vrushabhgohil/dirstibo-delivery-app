import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { locationService } from '@/services/location-service';
import { useAuth } from '@/features/auth/AuthContext';

interface LocationTrackerContextType {
  location: { latitude: number; longitude: number } | null;
  permissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
}

const LocationTrackerContext = createContext<LocationTrackerContextType | undefined>(undefined);

export const LocationTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { deliveryPerson } = useAuth();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const granted = await locationService.requestPermissions();
      setPermissionGranted(granted);
      if (granted) {
        await refreshLocation();
      }
      return granted;
    } catch {
      setPermissionGranted(false);
      return false;
    }
  };

  const refreshLocation = async (): Promise<void> => {
    try {
      const loc = await locationService.getCurrentLocation();
      if (loc) {
        setLocation(loc);
        if (deliveryPerson?.id) {
          await locationService.recordDeliveryLocationPing({
            deliveryPersonId: deliveryPerson.id,
            latitude: loc.latitude,
            longitude: loc.longitude,
            status: 'online',
          });
        }
      }
    } catch (err) {
      console.warn('Location refresh error:', err);
    }
  };

  useEffect(() => {
    requestPermission();
  }, [deliveryPerson?.id]);

  return (
    <LocationTrackerContext.Provider
      value={{
        location,
        permissionGranted,
        requestPermission,
        refreshLocation,
      }}
    >
      {children}
    </LocationTrackerContext.Provider>
  );
};

export const useLocationTracker = (): LocationTrackerContextType => {
  const context = useContext(LocationTrackerContext);
  if (!context) {
    throw new Error('useLocationTracker must be used within a LocationTrackerProvider');
  }
  return context;
};

