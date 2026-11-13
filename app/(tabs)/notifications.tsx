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
import { useRouter } from 'expo-router';
import { Bell, CheckCheck, Truck, Package, Info, AlertTriangle } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { notificationService } from '@/services/notification-service';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { NotificationItem } from '@/types';

export default function NotificationsScreen() {
  const router = useRouter();
  const { deliveryPerson } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['notifications_list', deliveryPerson?.user_id],
    queryFn: () => notificationService.getNotifications(deliveryPerson?.user_id || undefined),
    refetchInterval: 15000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(deliveryPerson?.user_id || undefined);
    refetch();
  };

  const handlePressNotification = async (item: NotificationItem) => {
    if (!item.is_read) {
      await notificationService.markAsRead(item.id);
      refetch();
    }

    if (item.reference_type === 'orders' && item.reference_id) {
      // Navigate to deliveries list or details
      router.push('/(tabs)/deliveries');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'delivery':
        return <Truck size={18} color={Colors.primaryDark} />;
      case 'order':
        return <Package size={18} color={Colors.info} />;
      case 'inventory':
        return <AlertTriangle size={18} color={Colors.warning} />;
      default:
        return <Info size={18} color={Colors.textSecondary} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            Consignment alerts & warehouse dispatch notices
          </Text>
        </View>

        {notifications.some((n) => !n.is_read) && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
          >
            <CheckCheck size={14} color={Colors.primaryDark} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
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
            <LoadingIndicator message="Checking for alerts..." />
          ) : (
            <EmptyState
              icon={<Bell size={36} color={Colors.textSecondary} />}
              title="No Notifications"
              description="You're all caught up! Real-time alerts regarding new delivery assignments and warehouse dispatches will appear here."
            />
          )
        }
        renderItem={({ item }) => {
          const dateStr = new Date(item.created_at).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <TouchableOpacity
              style={[styles.itemCard, !item.is_read && styles.itemCardUnread]}
              onPress={() => handlePressNotification(item)}
              activeOpacity={0.7}
            >
              <View style={styles.iconCircle}>{getNotificationIcon(item.type)}</View>

              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, !item.is_read && styles.titleUnread]}>
                    {item.title}
                  </Text>
                  {!item.is_read && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.message} numberOfLines={3}>
                  {item.message}
                </Text>

                <Text style={styles.timestamp}>{dateStr}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  markAllText: {
    ...Typography.tiny,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemCardUnread: {
    backgroundColor: '#FAFCF7',
    borderColor: '#D7EBB6',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryDark,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontSize: 14,
  },
  titleUnread: {
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    marginLeft: 6,
  },
  message: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  timestamp: {
    ...Typography.tiny,
    color: Colors.textLight,
    marginTop: 6,
  },
});

