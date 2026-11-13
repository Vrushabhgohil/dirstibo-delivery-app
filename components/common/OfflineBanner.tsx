import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useOfflineSync } from '@/features/offline/OfflineSyncContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <View style={[styles.container, !isOnline ? styles.offlineBg : styles.syncBg]}>
      <View style={styles.leftRow}>
        {!isOnline ? (
          <WifiOff size={16} color={Colors.danger} />
        ) : (
          <RefreshCw size={16} color={Colors.warning} />
        )}
        <Text style={styles.text}>
          {!isOnline
            ? 'Offline Mode — Changes will queue locally'
            : isSyncing
            ? `Syncing ${pendingCount} offline update(s)...`
            : `${pendingCount} update(s) waiting to sync`}
        </Text>
      </View>

      {isOnline && pendingCount > 0 && !isSyncing && (
        <TouchableOpacity style={styles.syncBtn} onPress={triggerSync} activeOpacity={0.7}>
          <Text style={styles.syncBtnText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  offlineBg: {
    backgroundColor: '#FEF2F2',
    borderBottomColor: '#FCA5A5',
  },
  syncBg: {
    backgroundColor: '#FFFBEB',
    borderBottomColor: '#FDE68A',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  text: {
    ...Typography.tiny,
    fontWeight: '600',
    color: Colors.text,
  },
  syncBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  syncBtnText: {
    ...Typography.tiny,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
});

