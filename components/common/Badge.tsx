import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { DeliveryAssignmentStatus, OrderStatus } from '@/types';

interface BadgeProps {
  status: DeliveryAssignmentStatus | OrderStatus | string;
  label?: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ status, label, style }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'assigned':
      case 'ready_for_delivery':
      case 'processing':
        return {
          bg: '#EFF6FF',
          text: '#2563EB',
          border: '#BFDBFE',
          display: label || 'Pending Pickup',
        };
      case 'in_transit':
      case 'out_for_delivery':
        return {
          bg: '#FEF3C7',
          text: '#D97706',
          border: '#FDE68A',
          display: label || 'Out For Delivery',
        };
      case 'delivered':
        return {
          bg: '#DCFCE7',
          text: '#15803D',
          border: '#BBF7D0',
          display: label || 'Delivered',
        };
      case 'partially_delivered':
        return {
          bg: '#F3E8FF',
          text: '#7E22CE',
          border: '#E9D5FF',
          display: label || 'Partially Delivered',
        };
      case 'rejected':
      case 'failed':
      case 'cancelled':
        return {
          bg: '#FEE2E2',
          text: '#B91C1C',
          border: '#FECACA',
          display: label || 'Failed / Rejected',
        };
      case 'confirmed':
        return {
          bg: Colors.primaryLight,
          text: Colors.primaryDark,
          border: '#D9F2A6',
          display: label || 'Approved / Confirmed',
        };
      default:
        return {
          bg: '#F3F4F6',
          text: '#4B5563',
          border: '#E5E7EB',
          display: label || status,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: config.text }]}>{config.display}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

