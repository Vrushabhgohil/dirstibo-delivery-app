import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import {
  MapPin,
  Phone,
  Package,
  Calendar,
  ChevronRight,
  Truck,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { DeliveryAssignment } from '@/types';
import { Badge } from '@/components/common/Badge';

interface DeliveryCardProps {
  assignment: DeliveryAssignment;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({ assignment }) => {
  const router = useRouter();
  const order = assignment.order;
  const store = order?.store;

  if (!order) return null;

  const productCount = order.items?.length || 0;
  const totalUnits = order.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0;

  const handlePress = () => {
    router.push({
      pathname: '/deliveries/[id]',
      params: { id: assignment.id },
    });
  };

  const handleCall = () => {
    if (store?.mobile) {
      Linking.openURL(`tel:${store.mobile}`);
    }
  };

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(order.total_amount || 0);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={styles.card}
    >
      {/* Header: Order Number & Delivery Status */}
      <View style={styles.cardHeader}>
        <View style={styles.orderNumberRow}>
          <Truck size={14} color={Colors.primaryDark} />
          <Text style={styles.orderNumber}>{order.order_number}</Text>
        </View>
        <Badge status={assignment.status} />
      </View>

      {/* Store Information */}
      <View style={styles.storeSection}>
        <Text style={styles.storeName}>{store?.name || 'Retail Outlet'}</Text>
        <View style={styles.infoRow}>
          <MapPin size={13} color={Colors.textSecondary} style={styles.icon} />
          <Text style={styles.addressText} numberOfLines={2}>
            {store?.address ? `${store.address}, ${store.area || ''}` : 'Address not specified'}
          </Text>
        </View>
      </View>

      {/* Metrics Row: Date, Items, Amount */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <View style={styles.metricIconLabel}>
            <Calendar size={12} color={Colors.textSecondary} />
            <Text style={styles.metricLabel}>Date</Text>
          </View>
          <Text style={styles.metricValue}>{order.order_date}</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <View style={styles.metricIconLabel}>
            <Package size={12} color={Colors.textSecondary} />
            <Text style={styles.metricLabel}>Products</Text>
          </View>
          <Text style={styles.metricValue}>
            {productCount} SKU ({totalUnits} units)
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>{formattedAmount}</Text>
        </View>
      </View>

      {/* Footer Actions */}
      <View style={styles.footerRow}>
        {store?.mobile ? (
          <TouchableOpacity
            style={styles.callButton}
            onPress={handleCall}
            activeOpacity={0.7}
          >
            <Phone size={13} color={Colors.primaryDark} />
            <Text style={styles.callButtonText}>Call Store</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        <View style={styles.viewDetailAction}>
          <Text style={styles.viewDetailText}>View Delivery</Text>
          <ChevronRight size={14} color={Colors.primaryDark} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderNumber: {
    ...Typography.bodyBold,
    fontFamily: 'monospace',
    color: Colors.text,
    fontSize: 13,
  },
  storeSection: {
    marginBottom: Spacing.md,
  },
  storeName: {
    ...Typography.heading3,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  icon: {
    marginTop: 2,
  },
  addressText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metricItem: {
    flex: 1,
  },
  metricIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  metricLabel: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  metricValue: {
    ...Typography.captionBold,
    color: Colors.text,
    fontSize: 11,
  },
  amountValue: {
    ...Typography.bodyBold,
    color: Colors.primaryDark,
    fontSize: 13,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: Spacing.sm,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  callButtonText: {
    ...Typography.tiny,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  viewDetailAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailText: {
    ...Typography.captionBold,
    color: Colors.primaryDark,
  },
});

