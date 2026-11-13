import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Warehouse as WarehouseIcon,
  Package,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { deliveryService } from '@/services/delivery-service';
import { Button } from '@/components/common/Button';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { useOfflineSync } from '@/features/offline/OfflineSyncContext';

export default function WarehousePickupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { deliveryPerson } = useAuth();
  const { isOnline, enqueueAction } = useOfflineSync();

  const [pickupNotes, setPickupNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch assignment and order details
  const { data: assignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ['delivery_details_pickup', id],
    queryFn: () => deliveryService.getDeliveryById(id, deliveryPerson?.id),
    enabled: Boolean(id),
  });

  // 2. Fetch Central FMCG Warehouse info
  const { data: warehouse, isLoading: loadingWarehouse } = useQuery({
    queryKey: ['central_warehouse_info'],
    queryFn: () => deliveryService.getCentralWarehouse(),
  });

  if (loadingAssignment || loadingWarehouse || !assignment) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <LoadingIndicator message="Verifying warehouse dispatch manifest..." />
      </SafeAreaView>
    );
  }

  const order = assignment.order;
  const items = order?.items || [];
  const totalUnits = items.reduce((acc, it) => acc + it.quantity, 0);

  const handleConfirmPickup = async () => {
    Alert.alert(
      'Confirm Warehouse Collection',
      `Are you sure you have physically loaded ${totalUnits} units for order ${order?.order_number} into vehicle ${deliveryPerson?.vehicle_number}?`,
      [
        { text: 'Verify Again', style: 'cancel' },
        {
          text: 'Confirm & Dispatch',
          style: 'default',
          onPress: async () => {
            setSubmitting(true);
            const payload = {
              assignmentId: assignment.id,
              orderId: order?.id || '',
              deliveryPersonId: deliveryPerson?.id || '',
              deliveryPersonName: deliveryPerson?.name || 'Pilot',
              notes: pickupNotes.trim() || undefined,
            };

            if (!isOnline) {
              await enqueueAction('CONFIRM_PICKUP', payload);
              setSubmitting(false);
              Alert.alert(
                'Queued for Sync',
                'You are offline. Pickup confirmation is saved locally and will automatically synchronize when connectivity returns.',
                [
                  {
                    text: 'Proceed to Delivery',
                    onPress: () =>
                      router.replace({
                        pathname: '/delivery/[id]',
                        params: { id: assignment.id },
                      }),
                  },
                ]
              );
              return;
            }

            const res = await deliveryService.confirmPickup(payload);
            setSubmitting(false);

            if (res.success) {
              Alert.alert('Pickup Confirmed', res.message, [
                {
                  text: 'Start Delivery Route',
                  onPress: () =>
                    router.replace({
                      pathname: '/delivery/[id]',
                      params: { id: assignment.id },
                    }),
                },
              ]);
            } else {
              Alert.alert('Pickup Failed', res.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Warehouse Dispatch Header */}
        <View style={styles.warehouseCard}>
          <View style={styles.warehouseTopRow}>
            <View style={styles.warehouseIconWrap}>
              <WarehouseIcon size={24} color={Colors.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.warehouseLabel}>ORIGIN GODOWN</Text>
              <Text style={styles.warehouseName}>{warehouse?.name || 'Central Godown'}</Text>
              <Text style={styles.warehouseCode}>Code: {warehouse?.code || 'WH-MAIN-01'}</Text>
            </View>
          </View>

          <View style={styles.warehouseInfoRow}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.warehouseAddressText}>
              {warehouse?.address}, {warehouse?.city}
            </Text>
          </View>

          {warehouse?.contact_person && (
            <View style={styles.warehouseInfoRow}>
              <Phone size={14} color={Colors.textSecondary} />
              <Text style={styles.warehouseAddressText}>
                Manager: {warehouse.contact_person} ({warehouse.contact_mobile})
              </Text>
            </View>
          )}
        </View>

        {/* Order & Assigned Pilot Verification */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Dispatch Manifest Verification</Text>
          <View style={styles.manifestGrid}>
            <View style={styles.manifestItem}>
              <Text style={styles.manifestLabel}>Order Number</Text>
              <Text style={styles.manifestValue}>{order?.order_number}</Text>
            </View>
            <View style={styles.manifestItem}>
              <Text style={styles.manifestLabel}>Destination Store</Text>
              <Text style={styles.manifestValue}>{order?.store?.name}</Text>
            </View>
            <View style={styles.manifestItem}>
              <Text style={styles.manifestLabel}>Assigned Pilot</Text>
              <Text style={styles.manifestValue}>{deliveryPerson?.name}</Text>
            </View>
            <View style={styles.manifestItem}>
              <Text style={styles.manifestLabel}>Vehicle Registration</Text>
              <Text style={styles.manifestValue}>{deliveryPerson?.vehicle_number}</Text>
            </View>
          </View>
        </View>

        {/* Items to Collect */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>SKUs to Collect & Inspect</Text>
            <Text style={styles.totalUnitsText}>{totalUnits} Total Units</Text>
          </View>

          {items.map((item, index) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemIndexCircle}>
                <Text style={styles.itemIndexText}>{index + 1}</Text>
              </View>
              <View style={styles.itemMeta}>
                <Text style={styles.itemName}>{item.product?.name || 'Product'}</Text>
                <Text style={styles.itemSub}>
                  SKU: {item.product?.sku || 'N/A'} • Pack Size: {item.product?.pack_size || 'Standard'}
                </Text>
              </View>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyLabel}>QTY</Text>
                <Text style={styles.qtyNumber}>{item.quantity}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Loading Notes (Optional) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Loading Inspection Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any warehouse notes (e.g. cartons checked, seals verified)..."
            placeholderTextColor={Colors.textLight}
            value={pickupNotes}
            onChangeText={setPickupNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Pre-Departure Checklist */}
        <View style={styles.checklistCard}>
          <View style={styles.checkRow}>
            <ShieldCheck size={18} color={Colors.success} />
            <Text style={styles.checkText}>Stock physically matched against packing slip.</Text>
          </View>
          <View style={styles.checkRow}>
            <ShieldCheck size={18} color={Colors.success} />
            <Text style={styles.checkText}>Cartons inspected for damage or tampering.</Text>
          </View>
          <View style={styles.checkRow}>
            <ShieldCheck size={18} color={Colors.success} />
            <Text style={styles.checkText}>Vehicle doors secured for transit.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footerBar}>
        <Button
          title={submitting ? 'Confirming Dispatch...' : 'Confirm Warehouse Pickup'}
          onPress={handleConfirmPickup}
          loading={submitting}
          size="lg"
          variant="primary"
          icon={<CheckCircle2 size={18} color={Colors.primaryDark} />}
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
    paddingBottom: 90,
  },
  warehouseCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  warehouseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  warehouseIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4ECA8',
  },
  warehouseLabel: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  warehouseName: {
    ...Typography.heading2,
    fontSize: 17,
    color: Colors.text,
  },
  warehouseCode: {
    ...Typography.caption,
    color: Colors.primaryDark,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  warehouseInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 6,
  },
  warehouseAddressText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.captionBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  totalUnitsText: {
    ...Typography.captionBold,
    color: Colors.primaryDark,
  },
  manifestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  manifestItem: {
    width: '47%',
  },
  manifestLabel: {
    ...Typography.tiny,
    color: Colors.textSecondary,
  },
  manifestValue: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontSize: 13,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  itemIndexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  itemIndexText: {
    ...Typography.tiny,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  itemMeta: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemName: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontSize: 13,
  },
  itemSub: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  qtyBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4ECA8',
  },
  qtyLabel: {
    ...Typography.tiny,
    fontSize: 8,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  qtyNumber: {
    ...Typography.heading3,
    color: Colors.primaryDark,
    fontSize: 16,
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
    height: 70,
  },
  checklistCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkText: {
    ...Typography.caption,
    color: '#166534',
    fontSize: 12,
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
    paddingVertical: Spacing.md,
  },
});

