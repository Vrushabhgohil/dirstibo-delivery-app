import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Plus, Minus, CheckCircle } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { OrderItem } from '@/types';

interface QuantityStepperProps {
  item: OrderItem;
  deliveredQuantity: number;
  onChangeQuantity: (qty: number) => void;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  item,
  deliveredQuantity,
  onChangeQuantity,
}) => {
  const orderedQty = item.quantity;
  const remainingQty = Math.max(0, orderedQty - deliveredQuantity);

  const handleDecrement = () => {
    if (deliveredQuantity > 0) {
      onChangeQuantity(deliveredQuantity - 1);
    }
  };

  const handleIncrement = () => {
    if (deliveredQuantity < orderedQty) {
      onChangeQuantity(deliveredQuantity + 1);
    }
  };

  const handleSetFull = () => {
    onChangeQuantity(orderedQty);
  };

  const handleSetZero = () => {
    onChangeQuantity(0);
  };

  const handleTextChange = (text: string) => {
    const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) {
      onChangeQuantity(0);
    } else {
      const clamped = Math.min(Math.max(0, num), orderedQty);
      onChangeQuantity(clamped);
    }
  };

  const isFull = deliveredQuantity === orderedQty;
  const isPartial = deliveredQuantity > 0 && deliveredQuantity < orderedQty;
  const isZero = deliveredQuantity === 0;

  return (
    <View style={styles.container}>
      {/* Product Information */}
      <View style={styles.topRow}>
        <View style={styles.productMeta}>
          <Text style={styles.productName}>{item.product?.name || 'FMCG Product'}</Text>
          <Text style={styles.productSub}>
            SKU: {item.product?.sku || 'N/A'} • {item.product?.pack_size || 'Pack'} • ₹{item.unit_price} / unit
          </Text>
        </View>

        <TouchableOpacity
          onPress={isFull ? handleSetZero : handleSetFull}
          style={[styles.quickBadge, isFull ? styles.quickBadgeActive : null]}
          activeOpacity={0.7}
        >
          <CheckCircle size={12} color={isFull ? '#FFF' : Colors.textSecondary} />
          <Text style={[styles.quickBadgeText, isFull ? styles.quickBadgeTextActive : null]}>
            {isFull ? 'All Items' : 'Full Drop'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stepper Controls & Remaining Calculations */}
      <View style={styles.controlsRow}>
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyBadgeLabel}>Ordered</Text>
          <Text style={styles.qtyBadgeValue}>{orderedQty}</Text>
        </View>

        <View style={styles.stepperBox}>
          <TouchableOpacity
            onPress={handleDecrement}
            disabled={deliveredQuantity <= 0}
            style={[styles.stepBtn, deliveredQuantity <= 0 && styles.stepBtnDisabled]}
            activeOpacity={0.6}
          >
            <Minus size={16} color={deliveredQuantity <= 0 ? Colors.textLight : Colors.text} />
          </TouchableOpacity>

          <TextInput
            style={styles.qtyInput}
            keyboardType="number-pad"
            value={String(deliveredQuantity)}
            onChangeText={handleTextChange}
            selectTextOnFocus
          />

          <TouchableOpacity
            onPress={handleIncrement}
            disabled={deliveredQuantity >= orderedQty}
            style={[styles.stepBtn, deliveredQuantity >= orderedQty && styles.stepBtnDisabled]}
            activeOpacity={0.6}
          >
            <Plus size={16} color={deliveredQuantity >= orderedQty ? Colors.textLight : Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.qtyBadge}>
          <Text style={styles.qtyBadgeLabel}>Remaining</Text>
          <Text
            style={[
              styles.qtyBadgeValue,
              remainingQty > 0 && styles.remainingAlert,
            ]}
          >
            {remainingQty}
          </Text>
        </View>
      </View>

      {/* Status note if partial */}
      {isPartial && (
        <View style={styles.partialNote}>
          <Text style={styles.partialNoteText}>
            ⚠️ Partial Drop: {remainingQty} units will remain pending for future delivery.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  productMeta: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  productName: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Colors.text,
  },
  productSub: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  quickBadgeActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  quickBadgeText: {
    ...Typography.tiny,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  quickBadgeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
  },
  qtyBadge: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  qtyBadgeLabel: {
    ...Typography.tiny,
    fontSize: 9,
    color: Colors.textSecondary,
  },
  qtyBadgeValue: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Colors.text,
  },
  remainingAlert: {
    color: Colors.danger,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  stepBtnDisabled: {
    opacity: 0.3,
  },
  qtyInput: {
    width: 50,
    height: 38,
    textAlign: 'center',
    ...Typography.bodyBold,
    fontSize: 16,
    color: Colors.text,
  },
  partialNote: {
    marginTop: Spacing.sm,
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  partialNoteText: {
    ...Typography.tiny,
    color: '#B45309',
    fontWeight: '600',
  },
});

