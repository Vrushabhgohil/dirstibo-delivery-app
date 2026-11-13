import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Phone,
  Mail,
  Truck,
  MapPin,
  HelpCircle,
  ShieldCheck,
  LogOut,
  RefreshCw,
  ChevronRight,
  Navigation,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { useLocationTracker } from '@/features/location/LocationTrackerContext';
import { useOfflineSync } from '@/features/offline/OfflineSyncContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { deliveryPerson, signOut } = useAuth();
  const { permissionGranted, requestPermission } = useLocationTracker();
  const { isOnline, pendingCount, triggerSync, isSyncing } = useOfflineSync();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out of the Distribo Delivery portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return 'DP';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery Pilot Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Pilot Identity Card */}
        <View style={styles.pilotCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{getInitials(deliveryPerson?.name)}</Text>
          </View>

          <View style={styles.pilotInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.pilotName}>{deliveryPerson?.name || 'Delivery Pilot'}</Text>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{deliveryPerson?.status || 'Active'}</Text>
              </View>
            </View>

            <Text style={styles.pilotId}>ID: {deliveryPerson?.employee_id || 'EMP-D001'}</Text>

            <View style={styles.vehicleRow}>
              <Truck size={14} color={Colors.primaryDark} />
              <Text style={styles.vehicleText}>
                {deliveryPerson?.vehicle_type || 'Mini Truck'} •{' '}
                <Text style={styles.vehiclePlate}>
                  {deliveryPerson?.vehicle_number || 'GJ-03-AB-1234'}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Fleet Contact Details</Text>

          <View style={styles.infoRow}>
            <Phone size={16} color={Colors.textSecondary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <Text style={styles.infoValue}>{deliveryPerson?.mobile || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Mail size={16} color={Colors.textSecondary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Registered Email</Text>
              <Text style={styles.infoValue}>{deliveryPerson?.email || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <MapPin size={16} color={Colors.textSecondary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Base Hub / Godown Area</Text>
              <Text style={styles.infoValue}>
                {deliveryPerson?.address || 'Central FMCG Distribution Hub'}
              </Text>
            </View>
          </View>
        </View>

        {/* Operational Diagnostics */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>App & Device Status</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={requestPermission}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Navigation size={18} color={permissionGranted ? Colors.success : Colors.warning} />
              <View>
                <Text style={styles.settingTitle}>GPS Location Access</Text>
                <Text style={styles.settingDesc}>
                  {permissionGranted ? 'Active & Calibrated' : 'Tap to enable device GPS'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, permissionGranted ? styles.statusSuccess : styles.statusWarning]}>
              <Text style={[styles.statusText, permissionGranted ? styles.statusSuccessText : styles.statusWarningText]}>
                {permissionGranted ? 'Granted' : 'Action Required'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={triggerSync}
            disabled={!isOnline || isSyncing}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <RefreshCw size={18} color={isOnline ? Colors.primaryDark : Colors.danger} />
              <View>
                <Text style={styles.settingTitle}>Offline Sync Engine</Text>
                <Text style={styles.settingDesc}>
                  {!isOnline
                    ? 'Offline Mode'
                    : isSyncing
                    ? 'Synchronizing...'
                    : pendingCount === 0
                    ? 'All changes synced with cloud'
                    : `${pendingCount} updates waiting to sync`}
                </Text>
              </View>
            </View>
            {pendingCount > 0 && isOnline && (
              <View style={[styles.statusBadge, styles.statusWarning]}>
                <Text style={[styles.statusText, styles.statusWarningText]}>Sync Now</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Navigation / Support Links */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Support & Resources</Text>

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => router.push('/help')}
            activeOpacity={0.7}
          >
            <View style={styles.navRowLeft}>
              <HelpCircle size={18} color={Colors.text} />
              <Text style={styles.navRowText}>Help & FAQs (Workflow Guide)</Text>
            </View>
            <ChevronRight size={16} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => {
              Alert.alert(
                'Security & Privacy',
                'Distribo Delivery securely synchronizes warehouse orders and drop logs directly to Aarvi Enterprise cloud servers under role-based access control.'
              );
            }}
            activeOpacity={0.7}
          >
            <View style={styles.navRowLeft}>
              <ShieldCheck size={18} color={Colors.text} />
              <Text style={styles.navRowText}>Privacy & Security Terms</Text>
            </View>
            <ChevronRight size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign Out of Delivery Account</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>
          Distribo Delivery Pilot App • v1.0.0 (Build 58)
        </Text>
      </ScrollView>
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
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.heading2,
    color: Colors.text,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  pilotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarLargeText: {
    ...Typography.heading2,
    color: Colors.primaryDark,
    fontSize: 20,
  },
  pilotInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pilotName: {
    ...Typography.heading3,
    fontSize: 16,
    color: Colors.text,
  },
  activePill: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  activePillText: {
    ...Typography.tiny,
    color: Colors.success,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pilotId: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  vehicleText: {
    ...Typography.captionBold,
    color: Colors.text,
    fontSize: 12,
  },
  vehiclePlate: {
    fontFamily: 'monospace',
    color: Colors.primaryDark,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    ...Typography.captionBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    fontSize: 11,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 4,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    ...Typography.tiny,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  settingDesc: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.tiny,
    fontWeight: '700',
  },
  statusSuccess: {
    backgroundColor: Colors.successLight,
  },
  statusSuccessText: {
    color: Colors.success,
  },
  statusWarning: {
    backgroundColor: Colors.warningLight,
  },
  statusWarningText: {
    color: Colors.warning,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  navRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  navRowText: {
    ...Typography.body,
    color: Colors.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    marginBottom: Spacing.lg,
  },
  logoutText: {
    ...Typography.bodyBold,
    color: Colors.danger,
  },
  versionText: {
    ...Typography.tiny,
    textAlign: 'center',
    color: Colors.textLight,
  },
});
