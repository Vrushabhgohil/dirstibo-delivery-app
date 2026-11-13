import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Phone,
  Truck,
  Calendar,
  Package,
  ArrowRight,
  Navigation,
  User,
  FileText,
  CheckCircle,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { deliveryService } from '@/services/delivery-service';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { OfflineBanner } from '@/components/common/OfflineBanner';

export default function DeliveryDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { deliveryPerson } = useAuth();

  const {
    data: assignment,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['delivery_details', id],
    queryFn: () => deliveryService.getDeliveryById(id, deliveryPerson?.id),
    enabled: Boolean(id),
  });

  if (isLoading || !assignment) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <LoadingIndicator message="Fetching consignment details..." />
      </SafeAreaView>
    );
  }

  const order = assignment.order;
  const store = order?.store;
  const items = order?.items || [];

  const handleCallStore = () => {
    if (store?.mobile) {
      Linking.openURL(`tel:${store.mobile}`);
    }
  };

  const handleOpenDirections = () => {
    if (store?.gps_lat && store?.gps_lng) {
      const scheme = Platform.select({
        ios: `maps:0,0?q=${store.gps_lat},${store.gps_lng}`,
        android: `geo:0,0?q=${store.gps_lat},${store.gps_lng}(${encodeURIComponent(store.name)})`,
      });
      if (scheme) Linking.openURL(scheme);
    } else if (store?.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${store.name}, ${store.address}, ${store.city || ''}`
      )}`;
      Linking.openURL(url);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  const isAssigned = assignment.status === 'assigned';
  const isInTransit = assignment.status === 'in_transit';
  const isDelivered = assignment.status === 'delivered';
  const isPartial = assignment.status === 'partially_delivered';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <OfflineBanner />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Status Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.orderLabel}>CONSIGNMENT ORDER</Text>
              <Text style={styles.orderNumber}>{order?.order_number}</Text>
            </View>
            <Badge status={assignment.status} />
          </View>

          <View style={styles.headerMetaRow}>
            <View style={styles.metaItem}>
              <Calendar size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>Booked: {order?.order_date}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Truck size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>Assigned: {assignment.assigned_date}</Text>
            </View>
          </View>
        </View>

        {/* Store Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Retail Store & Drop Location</Text>
          </View>

          <Text style={styles.storeName}>{store?.name}</Text>
          <Text style={styles.ownerText}>
            Proprietor: {store?.owner_name || 'Retailer'} • {store?.store_type || 'General Store'}
          </Text>

          <View style={styles.addressRow}>
            <MapPin size={16} color={Colors.textSecondary} style={{ marginTop: 2 }} />
            <Text style={styles.addressText}>
              {store?.address}, {store?.area}, {store?.city} - {store?.pincode}
            </Text>
          </View>

          {/* Quick Action Buttons for Store */}
          <View style={styles.storeActionRow}>
            {store?.mobile && (
              <TouchableOpacity
                style={styles.storeActionBtn}
                onPress={handleCallStore}
                activeOpacity={0.7}
              >
                <Phone size={15} color={Colors.primaryDark} />
                <Text style={styles.storeActionText}>Call {store.mobile}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.storeActionBtn, styles.mapsActionBtn]}
              onPress={handleOpenDirections}
              activeOpacity={0.7}
            >
              <Navigation size={15} color="#FFF" />
              <Text style={[styles.storeActionText, { color: '#FFF' }]}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ordered Product Line Items */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Consignment SKU Details</Text>
            <Text style={styles.itemCountText}>{items.length} Products</Text>
          </View>

          {items.map((item) => (
            <View key={item.id} style={styles.productRow}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.product?.name || 'Product'}</Text>
                <Text style={styles.productMeta}>
                  SKU: {item.product?.sku || 'N/A'} • {item.product?.pack_size || 'Pack'}
                </Text>
                <Text style={styles.productRate}>
                  {formatCurrency(item.unit_price)} × {item.quantity} units
                </Text>
              </View>

              <View style={styles.productQuantities}>
                <Text style={styles.qtyBadge}>Qty: {item.quantity}</Text>
                {item.delivered_quantity > 0 && (
                  <Text style={styles.deliveredQtyBadge}>
                    Delivered: {item.delivered_quantity}
                  </Text>
                )}
                <Text style={styles.lineTotal}>{formatCurrency(item.total_price)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Financial Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Order Financial Summary</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Ordered Units</Text>
            <Text style={styles.summaryValue}>
              {items.reduce((acc, it) => acc + it.quantity, 0)} Units
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(order?.total_amount || 0)}</Text>
          </View>

          {order?.discount_amount ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount Applied</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>
                -{formatCurrency(order.discount_amount)}
              </Text>
            </View>
          ) : null}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Invoice Payable Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(order?.total_amount || 0)}</Text>
          </View>
        </View>

        {/* Additional Information (Sales Rep & Notes) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Sales Representative & Dispatch Notes</Text>
          </View>

          {order?.salesperson && (
            <View style={styles.repRow}>
              <User size={15} color={Colors.textSecondary} />
              <Text style={styles.repText}>
                Booked by Rep:{' '}
                <Text style={{ fontWeight: '700', color: Colors.text }}>
                  {order.salesperson.name} ({order.salesperson.employee_id})
                </Text>
              </Text>
            </View>
          )}

          {order?.notes ? (
            <View style={styles.notesRow}>
              <FileText size={15} color={Colors.textSecondary} />
              <Text style={styles.notesText}>Note: {order.notes}</Text>
            </View>
          ) : (
            <Text style={styles.noNotesText}>No additional delivery notes specified.</Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        {isAssigned && (
          <Button
            title="Collect at Warehouse (Pickup)"
            onPress={() => router.push({ pathname: '/pickup/[id]', params: { id } })}
            size="lg"
            variant="primary"
            icon={<ArrowRight size={18} color={Colors.primaryDark} />}
          />
        )}

        {isInTransit && (
          <Button
            title="Execute Delivery Drop"
            onPress={() => router.push({ pathname: '/delivery/[id]', params: { id } })}
            size="lg"
            variant="dark"
            icon={<CheckCircle size={18} color="#FFF" />}
          />
        )}

        {(isDelivered || isPartial) && (
          <Button
            title="Consignment Completed"
            onPress={() => router.push('/(tabs)/history')}
            size="lg"
            variant="outline"
            disabled
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 90,
  },
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  orderLabel: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  orderNumber: {
    ...Typography.heading2,
    fontFamily: 'monospace',
    color: Colors.primaryDark,
    fontSize: 18,
    marginTop: 2,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.tiny,
    color: Colors.textSecondary,
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    paddingBottom: Spacing.xs,
  },
  cardTitle: {
    ...Typography.captionBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  itemCountText: {
    ...Typography.tiny,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  storeName: {
    ...Typography.heading2,
    fontSize: 18,
    color: Colors.text,
  },
  ownerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  addressText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.text,
    flex: 1,
    lineHeight: 18,
  },
  storeActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  storeActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#D7EBB6',
  },
  mapsActionBtn: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  storeActionText: {
    ...Typography.captionBold,
    color: Colors.primaryDark,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  productInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  productName: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Colors.text,
  },
  productMeta: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  productRate: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  productQuantities: {
    alignItems: 'flex-end',
  },
  qtyBadge: {
    ...Typography.captionBold,
    color: Colors.text,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  deliveredQtyBadge: {
    ...Typography.tiny,
    color: Colors.success,
    fontWeight: '700',
    marginTop: 2,
  },
  lineTotal: {
    ...Typography.bodyBold,
    color: Colors.primaryDark,
    marginTop: 4,
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  summaryValue: {
    ...Typography.captionBold,
    color: Colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  totalLabel: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  totalValue: {
    ...Typography.heading2,
    color: Colors.primaryDark,
    fontSize: 18,
  },
  repRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  repText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  notesText: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
  },
  noNotesText: {
    ...Typography.caption,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
});

