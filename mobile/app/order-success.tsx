import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius, Fonts } from '../constants/colors';

const { width } = Dimensions.get('window');

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();

  return (
    <View style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.circleOuter} />
      <View style={styles.circleInner} />

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>✅</Text>
        </View>

        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.subtitle}>
          Thank you for choosing Siddham Wellness.{'\n'}Your order has been placed successfully.
        </Text>

        {orderNumber && (
          <View style={styles.orderBox}>
            <Text style={styles.orderLabel}>ORDER NUMBER</Text>
            <Text style={styles.orderNumber}>{orderNumber}</Text>
          </View>
        )}

        <Text style={styles.note}>
          🚚 Your Ayurvedic products will be dispatched within 24 hours.
          You'll receive an email confirmation shortly.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(tabs)/index')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(tabs)/shop')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Browse More Products</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trustRow}>
          {['🌿 Natural', '🔬 Tested', '🚚 Fast Delivery', '🔄 Returns'].map((item, i) => (
            <Text key={i} style={styles.trustChip}>{item}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    overflow: 'hidden',
  },
  circleOuter: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    backgroundColor: 'rgba(196,133,42,0.06)',
    top: -width * 0.5,
    left: -width * 0.25,
  },
  circleInner: {
    position: 'absolute',
    width: width,
    height: width,
    borderRadius: width,
    backgroundColor: 'rgba(248,244,238,0.04)',
    bottom: -width * 0.3,
    right: -width * 0.3,
  },
  content: { alignItems: 'center', zIndex: 1, width: '100%' },
  iconWrap: {
    width: 90, height: 90,
    backgroundColor: 'rgba(248,244,238,0.12)',
    borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 2, borderColor: 'rgba(196,133,42,0.4)',
  },
  icon: { fontSize: 44 },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    color: Colors.parchment,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: 'rgba(248,244,238,0.75)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  orderBox: {
    backgroundColor: 'rgba(248,244,238,0.1)',
    borderWidth: 1, borderColor: 'rgba(196,133,42,0.4)',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  orderLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    color: Colors.saffronLight,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  orderNumber: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.parchment,
  },
  note: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: 'rgba(248,244,238,0.65)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.base,
  },
  actions: { width: '100%', gap: 12, marginBottom: Spacing.xl },
  primaryBtn: {
    backgroundColor: Colors.saffron,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: Colors.white, fontFamily: Fonts.sansBold, fontSize: 16 },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: 'rgba(248,244,238,0.3)',
    borderRadius: Radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: 'rgba(248,244,238,0.8)', fontFamily: Fonts.sansSemiBold, fontSize: 14 },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  trustChip: {
    backgroundColor: 'rgba(248,244,238,0.08)',
    color: 'rgba(248,244,238,0.6)',
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: 'rgba(248,244,238,0.15)',
  },
});
