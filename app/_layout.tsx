import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { queryClient } from '@/lib/query-client';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { OfflineSyncProvider } from '@/features/offline/OfflineSyncContext';
import { LocationTrackerProvider } from '@/features/location/LocationTrackerContext';
import { Colors } from '@/constants/theme';
import { View, ActivityIndicator } from 'react-native';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { deliveryPerson, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (!deliveryPerson && !inAuthGroup) {
      // Redirect to login if unauthenticated
      router.replace('/(auth)/login');
    } else if (deliveryPerson && inAuthGroup) {
      // Redirect to dashboard if logged in
      router.replace('/(tabs)');
    }
  }, [deliveryPerson, loading, segments]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primaryDark} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="deliveries/[id]"
        options={{
          headerShown: true,
          headerTitle: 'Delivery Details',
          headerStyle: { backgroundColor: Colors.card },
          headerTintColor: Colors.primaryDark,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="pickup/[id]"
        options={{
          headerShown: true,
          headerTitle: 'Warehouse Pickup',
          headerStyle: { backgroundColor: Colors.card },
          headerTintColor: Colors.primaryDark,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="delivery/[id]"
        options={{
          headerShown: true,
          headerTitle: 'Complete Delivery',
          headerStyle: { backgroundColor: Colors.card },
          headerTintColor: Colors.primaryDark,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="delivery/success"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="help/index"
        options={{
          headerShown: true,
          headerTitle: 'Help & FAQs',
          headerStyle: { backgroundColor: Colors.card },
          headerTintColor: Colors.primaryDark,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OfflineSyncProvider>
            <LocationTrackerProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </LocationTrackerProvider>
          </OfflineSyncProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

