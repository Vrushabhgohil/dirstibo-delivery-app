import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Truck,
  Clock,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { deliveryService } from '@/services/delivery-service';
import { Header } from '@/components/common/Header';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { DeliveryCard } from '@/components/deliveries/DeliveryCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';

export default function DashboardScreen() {
  const router = useRouter();
  const { deliveryPerson } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch dashboard metrics
  const {
    data: metrics = {
      totalAssigned: 0,
      pendingPickup: 0,
      outForDelivery: 0,
      completedToday: 0,
      partiallyDelivered: 0,
    },
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['delivery_dashboard_metrics', deliveryPerson?.id],
    queryFn: () => deliveryService.getDashboardMetrics(deliveryPerson?.id || ''),
    enabled: Boolean(deliveryPerson?.id),
    refetchInterval: 15000,
  });

  // 2. Fetch today's assigned deliveries
  const {
    data: deliveries = [],
    isLoading,
    refetch: refetchDeliveries,
  } = useQuery({
    queryKey: ['assigned_deliveries_today', deliveryPerson?.id],
    queryFn: () => deliveryService.getAssignedDeliveries(deliveryPerson?.id || ''),
    enabled: Boolean(deliveryPerson?.id),
    refetchInterval: 15000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchMetrics(), refetchDeliveries()]);
    setRefreshing(false);
  };

  const activeDeliveries = deliveries.filter(
    (d) => d.status === 'assigned' || d.status === 'in_transit'
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header />
      <OfflineBanner />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primaryDark]}
            tintColor={Colors.primaryDark}
          />
        }
      >
        {/* Metric Summary Cards Grid */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Shift Summary</Text>
          <View style={styles.metricsGrid}>
            {/* Total Assigned */}
            <TouchableOpacity
              style={[styles.metricCard, { borderLeftColor: Colors.info }]}
              onPress={() => router.push('/(tabs)/deliveries')}
              activeOpacity={0.8}
            >
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricLabel}>Total Assigned</Text>
                <Layers size={16} color={Colors.info} />
              </View>
              <Text style={styles.metricNumber}>{metrics.totalAssigned}</Text>
              <Text style={styles.metricSub}>All Orders</Text>
            </TouchableOpacity>

            {/* Pending Pickup */}
            <TouchableOpacity
              style={[styles.metricCard, { borderLeftColor: Colors.warning }]}
              onPress={() => router.push('/(tabs)/deliveries')}
              activeOpacity={0.8}
            >
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricLabel}>Pending Pickup</Text>
                <Clock size={16} color={Colors.warning} />
              </View>
              <Text style={styles.metricNumber}>{metrics.pendingPickup}</Text>
              <Text style={styles.metricSub}>At Warehouse</Text>
            </TouchableOpacity>

            {/* Out for Delivery */}
            <TouchableOpacity
              style={[styles.metricCard, { borderLeftColor: '#F97316' }]}
              onPress={() => router.push('/(tabs)/deliveries')}
              activeOpacity={0.8}
            >
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricLabel}>In Transit</Text>
                <Truck size={16} color="#F97316" />
              </View>
              <Text style={styles.metricNumber}>{metrics.outForDelivery}</Text>
              <Text style={styles.metricSub}>On the Route</Text>
            </TouchableOpacity>

            {/* Completed */}
            <TouchableOpacity
              style={[styles.metricCard, { borderLeftColor: Colors.success }]}
              onPress={() => router.push('/(tabs)/history')}
              activeOpacity={0.8}
            >
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricLabel}>Completed</Text>
                <CheckCircle2 size={16} color={Colors.success} />
              </View>
              <Text style={styles.metricNumber}>{metrics.completedToday}</Text>
              <Text style={styles.metricSub}>Fully Delivered</Text>
            </TouchableOpacity>
          </View>

          {/* Partial Deliveries Alert if any */}
          {metrics.partiallyDelivered > 0 && (
            <View style={styles.partialAlertCard}>
              <View style={styles.partialAlertContent}>
                <Package size={16} color={Colors.statusPartial} />
                <Text style={styles.partialAlertText}>
                  {metrics.partiallyDelivered} orders recorded with partial deliveries.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/history')}
                activeOpacity={0.7}
              >
                <Text style={styles.partialAlertAction}>Review</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Active Route Section */}
        <View style={styles.deliveriesSection}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Today's Delivery Beat</Text>
              <Text style={styles.sectionSubtitle}>
                Orders approved by Admin for dispatch & fulfillment
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push('/(tabs)/deliveries')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ArrowRight size={14} color={Colors.primaryDark} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <LoadingIndicator message="Loading today's assigned deliveries..." />
          ) : activeDeliveries.length === 0 ? (
            <EmptyState
              icon={<Truck size={36} color={Colors.primaryDark} />}
              title="No Active Deliveries"
              description="You have no pending pickups or deliveries in transit right now. Newly assigned orders from Admin will appear here automatically."
              actionTitle="View History"
              onAction={() => router.push('/(tabs)/history')}
            />
          ) : (
            activeDeliveries.map((assignment) => (
              <DeliveryCard key={assignment.id} assignment={assignment} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  metricsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.text,
    fontSize: 16,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  metricCard: {
    width: '47.5%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricNumber: {
    ...Typography.heading1,
    fontSize: 22,
    color: Colors.text,
  },
  metricSub: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  partialAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  partialAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  partialAlertText: {
    ...Typography.caption,
    color: Colors.statusPartial,
    fontWeight: '600',
    flex: 1,
  },
  partialAlertAction: {
    ...Typography.captionBold,
    color: Colors.statusPartial,
    marginLeft: Spacing.sm,
  },
  deliveriesSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    ...Typography.captionBold,
    color: Colors.primaryDark,
  },
});

