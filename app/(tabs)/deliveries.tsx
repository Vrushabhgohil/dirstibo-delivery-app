import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, X, Truck } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { deliveryService } from '@/services/delivery-service';
import { DeliveryCard } from '@/components/deliveries/DeliveryCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { OfflineBanner } from '@/components/common/OfflineBanner';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'ready_for_pickup', label: 'Pending Pickup' },
  { id: 'out_for_delivery', label: 'In Transit' },
  { id: 'partially_delivered', label: 'Partial Drop' },
  { id: 'delivered', label: 'Delivered' },
];

export default function MyDeliveriesScreen() {
  const { deliveryPerson } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: deliveries = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['my_deliveries', deliveryPerson?.id, selectedFilter],
    queryFn: () =>
      deliveryService.getAssignedDeliveries(
        deliveryPerson?.id || '',
        selectedFilter
      ),
    enabled: Boolean(deliveryPerson?.id),
    refetchInterval: 15000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Filter in memory for search query (by Order Number or Store Name)
  const filteredDeliveries = deliveries.filter((d) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const orderNumber = d.order?.order_number?.toLowerCase() || '';
    const storeName = d.order?.store?.name?.toLowerCase() || '';
    const storeArea = d.order?.store?.area?.toLowerCase() || '';

    return (
      orderNumber.includes(q) ||
      storeName.includes(q) ||
      storeArea.includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Deliveries</Text>
        <Text style={styles.headerSubtitle}>
          Assigned fulfillments for {deliveryPerson?.name || 'Pilot'}
        </Text>
      </View>

      <OfflineBanner />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search size={18} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Order # or Store Name..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <X size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = selectedFilter === item.id;
            return (
              <TouchableOpacity
                onPress={() => setSelectedFilter(item.id)}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    isSelected && styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main Delivery List */}
      <FlatList
        data={filteredDeliveries}
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
            <LoadingIndicator message="Fetching assigned deliveries..." />
          ) : (
            <EmptyState
              icon={<Truck size={36} color={Colors.textSecondary} />}
              title="No Deliveries Found"
              description={
                searchQuery
                  ? `No orders matching "${searchQuery}". Try a different search term or clear the filter.`
                  : 'No delivery assignments found under this status filter.'
              }
              actionTitle={searchQuery ? 'Clear Search' : undefined}
              onAction={searchQuery ? () => setSearchQuery('') : undefined}
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
  searchContainer: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 42,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 13,
    color: Colors.text,
  },
  filterContainer: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  filterList: {
    paddingHorizontal: Spacing.lg,
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

