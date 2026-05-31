import React, { useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../constants/colors';
import { useCart } from '../../context/CartContext';

const SHIPPING_THRESHOLD = 999;
const SHIPPING_COST = 99;

export default function CartScreen() {
  const router = useRouter();
  const { items, total, removeItem, updateQty } = useCart();

  const shipping = total > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const grandTotal = total + shipping;

  const handleDecrease = useCallback(
    (id: string | number, currentQty: number) => {
      if (currentQty <= 1) {
        removeItem(id);
      } else {
        updateQty(id, currentQty - 1);
      }
    },
    [removeItem, updateQty],
  );

  const handleIncrease = useCallback(
    (id: string | number, currentQty: number) => {
      updateQty(id, currentQty + 1);
    },
    [updateQty],
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof items)[number] }) => (
      <View style={styles.itemCard}>
        <View style={styles.itemEmoji}>
          <Text style={styles.itemEmojiText}>🌿</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.qtyBtn}
              onPress={() => handleDecrease(item.id, item.quantity)}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.qtyBtn}
              onPress={() => handleIncrease(item.id, item.quantity)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemLineTotal}>₹{item.price * item.quantity}</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.removeBtn}
            onPress={() => removeItem(item.id)}
          >
            <Text style={styles.removeBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleDecrease, handleIncrease, removeItem],
  );

  const ListFooter = (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Order Summary</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>₹{total}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Shipping</Text>
        {shipping === 0 ? (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>FREE</Text>
          </View>
        ) : (
          <Text style={styles.summaryValue}>₹{shipping}</Text>
        )}
      </View>
      {shipping > 0 && (
        <Text style={styles.freeShippingHint}>
          Add ₹{SHIPPING_THRESHOLD - total} more for free shipping
        </Text>
      )}
      <View style={styles.divider} />
      <View style={styles.summaryRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>₹{grandTotal}</Text>
      </View>
    </View>
  );

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Explore our products and add something you love.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.shopBtn}
            onPress={() => router.push('/(tabs)/shop')}
          >
            <Text style={styles.shopBtnText}>Go to Shop</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.headerCount}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={ListFooter}
      />

      {/* Sticky Checkout Button */}
      <View style={styles.checkoutBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.checkoutBtn}
          onPress={() => router.push('/checkout')}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Text style={styles.checkoutBtnPrice}>₹{grandTotal}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.cream,
  },
  headerTitle: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    color: Colors.forestDark,
  },
  headerCount: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.gray500,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
    ...Shadow.sm,
  },
  itemEmoji: {
    width: 70,
    height: 70,
    backgroundColor: Colors.parchment,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  itemEmojiText: {
    fontSize: 34,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.forestDark,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  itemPrice: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.gray500,
    marginBottom: Spacing.sm,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    backgroundColor: Colors.parchmentDark,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.forestDark,
    lineHeight: 20,
  },
  qtyText: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    color: Colors.forestDark,
    minWidth: 22,
    textAlign: 'center',
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginLeft: Spacing.sm,
  },
  itemLineTotal: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    color: Colors.forest,
  },
  removeBtn: {
    padding: Spacing.xs,
  },
  removeBtnText: {
    fontSize: 20,
  },
  summaryContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginTop: Spacing.sm,
    ...Shadow.sm,
  },
  summaryTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.forestDark,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.gray500,
  },
  summaryValue: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.gray700,
  },
  freeBadge: {
    backgroundColor: Colors.successBg,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  freeBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    color: Colors.success,
  },
  freeShippingHint: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.saffron,
    marginBottom: Spacing.sm,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.parchmentDark,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.forestDark,
  },
  totalValue: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.forest,
  },
  checkoutBar: {
    backgroundColor: Colors.cream,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDark,
  },
  checkoutBtn: {
    backgroundColor: Colors.forest,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    ...Shadow.md,
  },
  checkoutBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.white,
  },
  checkoutBtnPrice: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.saffronLight,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  emptyEmoji: {
    fontSize: 72,
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    color: Colors.forestDark,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.gray500,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  shopBtn: {
    backgroundColor: Colors.forest,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
    ...Shadow.md,
  },
  shopBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.white,
  },
});
