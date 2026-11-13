import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notification-service';

export const Header: React.FC = () => {
  const router = useRouter();
  const { deliveryPerson } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread_notifications_count', deliveryPerson?.user_id],
    queryFn: () => notificationService.getUnreadCount(deliveryPerson?.user_id || undefined),
    refetchInterval: 15000,
  });

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

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
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftSection}>
          <Image
            source={require('@/assets/images/distribo-full-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => router.push('/(tabs)/notifications')}
            activeOpacity={0.7}
          >
            <Bell size={20} color={Colors.text} />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(deliveryPerson?.name)}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greetingText}>
            Welcome, <Text style={styles.boldName}>{deliveryPerson?.name || 'Delivery Pilot'}</Text>
          </Text>
          <Text style={styles.vehicleInfo}>
            {deliveryPerson?.vehicle_type || 'Fleet Vehicle'} • {deliveryPerson?.vehicle_number || 'Aarvi Fleet'}
          </Text>
        </View>
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>{todayStr}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
  },
  logo: {
    width: 140,
    height: 38,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  unreadText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  profileBtn: {
    marginLeft: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  greetingText: {
    ...Typography.body,
    fontSize: 13,
  },
  boldName: {
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  vehicleInfo: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  dateBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateText: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

