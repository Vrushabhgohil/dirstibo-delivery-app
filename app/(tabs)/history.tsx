import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { History, Calendar, CheckCircle2, PackageCheck } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { deliveryService } from '@/services/delivery-service';
import { DeliveryCard } from '@/components/deliveries/DeliveryCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';

const HISTORY_FILTERS = [
  { id: 'all_history', label: 'All History' },
  { id: 'delivered', label: 'Fully Delivered' },
  { id: 'partially_delivered', label: 'Partially Delivered' },
];

export default function DeliveryHistoryScreen() {
  const { deliveryPerson } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all_history');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: deliveries = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['delivery_history', deliveryPerson?.id],
    queryFn: () => deliveryService.getAssignedDeliveries(deliveryPerson?.id || ''),
    enabled: Boolean(deliveryPerson?.id),
    refetchInterval: 20000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Filter completed and partial deliveries
  const historyDeliveries = deliveries.filter((d) => {
    const isCompleted = d.status === 'delivered' || d.status === 'partially_delivered';
    if (!isCompleted) return false;

    if (selectedFilter === 'delivered') return d.status === 'delivered';
    if (selectedFilter === 'partially_delivered') return d.status === 'partially_delivered';
    return true;
  });

  const totalDeliveredCount = deliveries.filter((d) => d.status === 'delivered').length;
  const totalPartialCount = deliveries.filter((d) => d.status === 'partially_delivered').length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery History</Text>
        <Text style={styles.headerSubtitle}>
          Past consignments completed by {deliveryPerson?.name || 'Pilot'}
        </Text>
      </View>

      {/* Summary KPI Strip */}
      <View style={styles.kpiStrip}>
        <View style={styles.kpiBox}>
          <CheckCircle2 size={16} color={Colors.success} />
          <View>
            <Text style={styles.kpiValue}>{totalDeliveredCount}</Text>
            <Text style={styles.kpiLabel}>Full Drops</Text>
          </View>
        </View>

        <View style={styles.kpiDivider} />

        <View style={styles.kpiBox}>
          <PackageCheck size={16} color={Colors.statusPartial} />
          <View>
            <Text style={styles.kpiValue}>{totalPartialCount}</Text>
            <Text style={styles.kpiLabel}>Partial Drops</Text>
          </View>
        </View>

        <View style={styles.kpiDivider} />

        <View style={styles.kpiBox}>
          <Calendar size={16} color={Colors.textSecondary} />
          <View>
            <Text style={styles.kpiValue}>{totalDeliveredCount + totalPartialCount}</Text>
            <Text style={styles.kpiLabel}>Total Logs</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterStrip}>
        {HISTORY_FILTERS.map((f) => {
          const isSelected = selectedFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setSelectedFilter(f.id)}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* History List */}
      <FlatList
        data={historyDeliveries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primaryDark]}
            tintColor={Colors.primaryDark}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <LoadingIndicator message="Loading history records..." />
          ) : (
            <EmptyState
              icon={<History size={36} color={Colors.textSecondary} />}
              title="No Delivery History Yet"
              description="Completed deliveries and partial drops will appear here in chronological order with full timestamps and quantity breakdowns."
            />
          )
        }
        renderItem={({ item }) => <DeliveryCard assignment={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.heading2,
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  kpiStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  kpiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  kpiValue: {
    ...Typography.heading3,
    fontSize: 16,
    color: Colors.text,
  },
  kpiLabel: {
    ...Typography.tiny,
    color: Colors.textSecondary,
  },
  kpiDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  filterStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  filterText: {
    ...Typography.captionBold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
});

