import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, PackageCheck, ArrowRight, Truck } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Button } from '@/components/common/Button';

export default function DeliverySuccessScreen() {
  const router = useRouter();
  const {
    orderNumber,
    storeName,
    isPartial,
    deliveredUnits,
    orderedUnits,
    isOffline,
  } = useLocalSearchParams<{
    orderNumber: string;
    storeName: string;
    isPartial: string;
    deliveredUnits: string;
    orderedUnits: string;
    isOffline: string;
  }>();

  const partial = isPartial === 'true';
  const offline = isOffline === 'true';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Success Animated / Styled Icon */}
          <View style={[styles.iconCircle, partial && styles.partialIconCircle]}>
            {partial ? (
              <PackageCheck size={52} color={Colors.statusPartial} />
            ) : (
              <CheckCircle2 size={52} color={Colors.success} />
            )}
          </View>

          <Text style={styles.title}>
            {partial ? 'Partial Delivery Logged!' : 'Delivery Completed!'}
          </Text>

          <Text style={styles.subtitle}>
            {partial
              ? `Partial drop of ${deliveredUnits} / ${orderedUnits} units successfully recorded for ${storeName || 'the retail store'}.`
              : `All ${deliveredUnits} units have been safely handed over to ${storeName || 'the retail store'}.`}
          </Text>

          {/* Details Card */}
          <View style={styles.receiptCard}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Order Number</Text>
              <Text style={styles.receiptValue}>{orderNumber || 'ORD-COMPLETED'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Store Name</Text>
              <Text style={styles.receiptValue}>{storeName || 'Retail Outlet'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Fulfillment Status</Text>
              <Text style={[styles.receiptValue, { color: partial ? Colors.statusPartial : Colors.success }]}>
                {partial ? 'Partially Delivered' : 'Fully Delivered'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Delivered Units</Text>
              <Text style={styles.receiptValue}>
                {deliveredUnits} of {orderedUnits} Units
              </Text>
            </View>

            {offline && (
              <View style={styles.offlineNotice}>
                <Text style={styles.offlineNoticeText}>
                  ⚡ Saved offline. Will sync with central CRM when connected.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title="Return to Dashboard"
            onPress={() => router.replace('/(tabs)')}
            size="lg"
            variant="dark"
            style={styles.actionBtn}
            icon={<ArrowRight size={18} color="#FFF" />}
          />

          <Button
            title="View Next Assigned Delivery"
            onPress={() => router.replace('/(tabs)/deliveries')}
            size="md"
            variant="outline"
            style={styles.actionBtn}
            icon={<Truck size={16} color={Colors.text} />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  partialIconCircle: {
    backgroundColor: '#FAF5FF',
    borderColor: '#D8B4FE',
  },
  title: {
    ...Typography.heading1,
    fontSize: 24,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: Spacing.xxl,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  receiptLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  receiptValue: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: Spacing.sm,
  },
  offlineNotice: {
    marginTop: Spacing.md,
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  offlineNoticeText: {
    ...Typography.tiny,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsContainer: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  actionBtn: {
    width: '100%',
  },
});

