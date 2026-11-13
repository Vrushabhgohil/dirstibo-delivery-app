import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Store,
  Phone,
  Navigation,
  CheckCircle,
  AlertTriangle,
  FileText,
  CheckSquare,
  Truck,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { deliveryService } from '@/services/delivery-service';
import { QuantityStepper } from '@/components/deliveries/QuantityStepper';
import { Button } from '@/components/common/Button';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { useOfflineSync } from '@/features/offline/OfflineSyncContext';

export default function DeliveryExecutionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { deliveryPerson } = useAuth();
  const { isOnline, enqueueAction } = useOfflineSync();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch assignment and order details
  const { data: assignment, isLoading } = useQuery({
    queryKey: ['delivery_execution_details', id],
    queryFn: () => deliveryService.getDeliveryById(id, deliveryPerson?.id),
    enabled: Boolean(id),
  });

  const order = assignment?.order;
  const store = order?.store;
  const items = order?.items || [];

  // Initialize delivered quantities default to ordered quantities (assume full delivery initially)
  useEffect(() => {
    if (items.length > 0 && Object.keys(quantities).length === 0) {
      const initial: Record<string, number> = {};
      items.forEach((item) => {
        initial[item.id] = item.quantity;
      });
      setQuantities(initial);
    }
  }, [items]);

  if (isLoading || !assignment) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <LoadingIndicator message="Opening delivery manifest..." />
      </SafeAreaView>
    );
  }

  const handleUpdateQty = (itemId: string, newQty: number) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: newQty,
    }));
  };

  const handleMarkAllFull = () => {
    const full: Record<string, number> = {};
    items.forEach((item) => {
      full[item.id] = item.quantity;
    });
    setQuantities(full);
  };

  const handleCallStore = () => {
    if (store?.mobile) {
      Linking.openURL(`tel:${store.mobile}`);
    }
  };

  const handleOpenMaps = () => {
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

  // Compute totals
  let totalOrderedUnits = 0;
  let totalDeliveredUnits = 0;
  items.forEach((it) => {
    totalOrderedUnits += it.quantity;
    totalDeliveredUnits += quantities[it.id] ?? it.quantity;
  });

  const isPartial = totalDeliveredUnits < totalOrderedUnits;
  const remainingUnits = totalOrderedUnits - totalDeliveredUnits;

  const handleSubmitDelivery = async () => {
    if (totalDeliveredUnits === 0) {
      Alert.alert(
        'Zero Quantity Entered',
        'Cannot complete delivery with 0 units delivered. If delivery failed, please contact your dispatcher.'
      );
      return;
    }

    if (isPartial && !deliveryNotes.trim()) {
      Alert.alert(
        'Partial Delivery Reason Required',
        `You have recorded a partial delivery (${totalDeliveredUnits}/${totalOrderedUnits} units). Please add a short reason in the notes field (e.g. store had insufficient cash, goods refused, damaged carton).`
      );
      return;
    }

    const confirmationTitle = isPartial
      ? 'Confirm Partial Delivery'
      : 'Confirm Full Delivery';

    const confirmationMessage = isPartial
      ? `You are confirming a PARTIAL drop: ${totalDeliveredUnits} units delivered, ${remainingUnits} units remaining undelivered. Proceed?`
      : `Confirm that all ${totalOrderedUnits} units have been safely handed over to ${store?.name}?`;

    Alert.alert(confirmationTitle, confirmationMessage, [
      { text: 'Review', style: 'cancel' },
      {
        text: 'Confirm Drop',
        style: 'default',
        onPress: async () => {
          setSubmitting(true);

          const lineItemDeliveries = items.map((item) => ({
            orderItemId: item.id,
            productId: item.product_id,
            orderedQty: item.quantity,
            deliveredQty: quantities[item.id] ?? item.quantity,
          }));

          const payload = {
            assignmentId: assignment.id,
            orderId: order?.id || '',
            deliveryPersonId: deliveryPerson?.id || '',
            deliveryPersonName: deliveryPerson?.name || 'Pilot',
            lineItemDeliveries,
            notes: deliveryNotes.trim() || undefined,
          };

          if (!isOnline) {
            await enqueueAction('COMPLETE_DELIVERY', payload);
            setSubmitting(false);
            router.replace({
              pathname: '/delivery/success',
              params: {
                orderNumber: order?.order_number,
                storeName: store?.name,
                isPartial: isPartial ? 'true' : 'false',
                deliveredUnits: String(totalDeliveredUnits),
                orderedUnits: String(totalOrderedUnits),
                isOffline: 'true',
              },
            });
            return;
          }

          const res = await deliveryService.completeDelivery(payload);
          setSubmitting(false);

          if (res.success) {
            router.replace({
              pathname: '/delivery/success',
              params: {
                orderNumber: order?.order_number,
                storeName: store?.name,
                isPartial: isPartial ? 'true' : 'false',
                deliveredUnits: String(totalDeliveredUnits),
                orderedUnits: String(totalOrderedUnits),
                isOffline: 'false',
              },
            });
          } else {
            Alert.alert('Submission Error', res.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Store Location Header */}
        <View style={styles.storeCard}>
          <View style={styles.storeHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeLabel}>RETAIL DESTINATION</Text>
              <Text style={styles.storeName}>{store?.name || 'Retail Outlet'}</Text>
              <Text style={styles.storeOwner}>Owner: {store?.owner_name || 'Store Proprietor'}</Text>
            </View>
            <View style={styles.orderBadge}>
              <Text style={styles.orderBadgeText}>{order?.order_number}</Text>
            </View>
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.addressText}>
              {store?.address}, {store?.area}, {store?.city}
            </Text>
          </View>

          <View style={styles.storeActionRow}>
            {store?.mobile && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleCallStore}
                activeOpacity={0.7}
              >
                <Phone size={15} color={Colors.primaryDark} />
                <Text style={styles.actionBtnText}>Call Store</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, styles.mapsBtn]}
              onPress={handleOpenMaps}
              activeOpacity={0.7}
            >
              <Navigation size={15} color="#FFF" />
              <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quantities Section Header with Quick Full Drop Action */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Product Delivery Quantities</Text>
            <Text style={styles.sectionSubtitle}>
              Adjust individual item quantities for partial drops
            </Text>
          </View>

          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAllFull}
            activeOpacity={0.7}
          >
            <CheckSquare size={14} color={Colors.primaryDark} />
            <Text style={styles.markAllText}>Mark All Full</Text>
          </TouchableOpacity>
        </View>

        {/* Quantity Stepper List */}
        {items.map((item) => (
          <QuantityStepper
            key={item.id}
            item={item}
            deliveredQuantity={quantities[item.id] ?? item.quantity}
            onChangeQuantity={(qty) => handleUpdateQty(item.id, qty)}
          />
        ))}

        {/* Partial Delivery Summary Banner */}
        {isPartial && (
          <View style={styles.partialAlertCard}>
            <View style={styles.partialAlertHeader}>
              <AlertTriangle size={18} color="#B45309" />
              <Text style={styles.partialAlertTitle}>Partial Drop Detected</Text>
            </View>
            <Text style={styles.partialAlertDesc}>
              Delivering <Text style={{ fontWeight: '700' }}>{totalDeliveredUnits}</Text> of{' '}
              <Text style={{ fontWeight: '700' }}>{totalOrderedUnits}</Text> total units. Undelivered units ({remainingUnits}) will remain on record for Admin follow-up.
            </Text>
          </View>
        )}

        {/* Delivery / Storekeeper Notes */}
        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <FileText size={15} color={Colors.textSecondary} />
            <Text style={styles.notesTitle}>
              {isPartial ? 'Reason for Partial Delivery (Required)' : 'Storekeeper Sign-off / Notes (Optional)'}
            </Text>
          </View>
          <TextInput
            style={styles.notesInput}
            placeholder={
              isPartial
                ? 'e.g. Store had cash shortage, 2 units damaged during unloading, store requested split delivery...'
                : 'Add any delivery comments, payment collected notes, or receiver name...'
            }
            placeholderTextColor={Colors.textLight}
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footerBar}>
        <View style={styles.footerTotals}>
          <Text style={styles.footerUnitsText}>
            Delivering: <Text style={styles.boldUnit}>{totalDeliveredUnits}</Text> / {totalOrderedUnits} Units
          </Text>
          <Text style={styles.statusIndicator}>
            {isPartial ? '⚠️ Partial Fulfillment' : '✓ Full Fulfillment'}
          </Text>
        </View>

        <Button
          title={submitting ? 'Submitting Drop...' : isPartial ? 'Complete Partial Delivery' : 'Complete Full Delivery'}
          onPress={handleSubmitDelivery}
          loading={submitting}
          size="lg"
          variant={isPartial ? 'primary' : 'dark'}
          icon={<CheckCircle size={18} color={isPartial ? Colors.primaryDark : '#FFF'} />}
        />
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
    paddingBottom: 110,
  },
  storeCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  storeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  storeLabel: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  storeName: {
    ...Typography.heading2,
    fontSize: 17,
    color: Colors.text,
  },
  storeOwner: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderBadge: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  orderBadgeText: {
    ...Typography.tiny,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  addressBox: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  addressText: {
    ...Typography.caption,
    color: Colors.text,
    lineHeight: 16,
  },
  storeActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#D7EBB6',
  },
  mapsBtn: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  actionBtnText: {
    ...Typography.captionBold,
    color: Colors.primaryDark,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontSize: 15,
  },
  sectionSubtitle: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  markAllText: {
    ...Typography.tiny,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  partialAlertCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginVertical: Spacing.sm,
  },
  partialAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  partialAlertTitle: {
    ...Typography.captionBold,
    color: '#B45309',
  },
  partialAlertDesc: {
    ...Typography.caption,
    color: '#92400E',
    lineHeight: 17,
  },
  notesCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.sm,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  notesTitle: {
    ...Typography.captionBold,
    color: Colors.text,
    fontSize: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    ...Typography.body,
    fontSize: 13,
    color: Colors.text,
    textAlignVertical: 'top',
    height: 75,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  footerTotals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  footerUnitsText: {
    ...Typography.caption,
    color: Colors.text,
  },
  boldUnit: {
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  statusIndicator: {
    ...Typography.tiny,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
});

