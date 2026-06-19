import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../constants/colors';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';
import type { Product } from '../../services/api';

const CATEGORY_ICONS: Record<string, string> = {
  'hair-care': '💆',
  'supplements': '💊',
  'skin-care': '✨',
  'oils-essentials': '🌿',
  'ayurvedic-herbal-formulation': '🍶',
  'ayurvedic-proprietary-medicine': '💊',
  'ayurvedic-formulation': '🍯',
};

const TABS = ['Description', 'Ingredients', 'Usage'] as const;
type Tab = (typeof TABS)[number];

const STICKY_THRESHOLD = 340; // px scrolled before sticky bar appears

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('Description');
  const [showStickyBar, setShowStickyBar] = useState(false);

  const tabUnderlineX = useRef(new Animated.Value(0)).current;
  const tabWidths = useRef<Record<Tab, number>>({} as Record<Tab, number>);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.products
      .get(id)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load product. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleTabPress = useCallback(
    (tab: Tab, index: number) => {
      setActiveTab(tab);
      const xPositions: number[] = TABS.map((_, i) =>
        TABS.slice(0, i).reduce((acc, t) => acc + (tabWidths.current[t] ?? 0), 0),
      );
      Animated.spring(tabUnderlineX, {
        toValue: xPositions[index] ?? 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }).start();
    },
    [tabUnderlineX],
  );

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    setShowStickyBar(e.nativeEvent.contentOffset.y > STICKY_THRESHOLD);
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addItem(product, qty);
    router.push('/(tabs)/cart');
  }, [addItem, product, qty, router]);

  const decreaseQty = () => setQty((q) => Math.max(1, q - 1));
  const increaseQty = () => {
    if (!product) return;
    const max = product.stock ?? 99;
    setQty((q) => Math.min(max, q + 1));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.forest} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error ?? 'Product not found.'}</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasDiscount =
    product.comparePrice != null && product.comparePrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : 0;
  const categoryIcon = CATEGORY_ICONS[product.category?.slug ?? ''] ?? '🌿';

  const stockStatus: 'in' | 'low' | 'out' =
    (product.stock ?? 0) === 0
      ? 'out'
      : (product.stock ?? 99) <= 5
      ? 'low'
      : 'in';

  const tabContent: Record<Tab, string> = {
    Description:
      product.description ??
      'Experience the ancient wisdom of Ayurveda with this carefully formulated product. Crafted using time-tested recipes and the finest natural ingredients, it brings you holistic wellness rooted in tradition.',
    Ingredients:
      product.ingredients ??
      'Natural herbs and botanicals sourced from certified farms. Free from parabens, sulphates, and artificial fragrances. Full ingredient list printed on packaging.',
    Usage:
      product.usage ??
      'Apply or consume as directed on the packaging. For best results, use consistently as part of your daily wellness routine. Consult an Ayurvedic practitioner for personalised guidance.',
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Back Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.backNavBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.backNavIcon}>‹</Text>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image */}
        <View style={styles.heroImageContainer}>
          <Text style={styles.heroEmoji}>{categoryIcon}</Text>
          {hasDiscount && (
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{discountPct}% OFF</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          {/* Category Tag */}
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>
              {product.category?.name ?? 'Wellness'}
            </Text>
          </View>

          {/* Name */}
          <Text style={styles.productName}>{product.name}</Text>

          {/* Weight / SKU */}
          {(product.weight ?? product.sku) && (
            <Text style={styles.productMeta}>
              {product.weight ? `${product.weight}` : ''}
              {product.weight && product.sku ? '  •  ' : ''}
              {product.sku ? `SKU: ${product.sku}` : ''}
            </Text>
          )}

          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={styles.mainPrice}>₹{product.price}</Text>
            {hasDiscount && (
              <Text style={styles.comparePrice}>₹{product.comparePrice}</Text>
            )}
            {hasDiscount && (
              <View style={styles.discountTag}>
                <Text style={styles.discountTagText}>{discountPct}% off</Text>
              </View>
            )}
          </View>

          {/* Stock Status */}
          <View style={[styles.stockBadge, stockStatus === 'out' && styles.stockBadgeOut, stockStatus === 'low' && styles.stockBadgeLow]}>
            <Text style={[styles.stockText, stockStatus === 'out' && styles.stockTextOut, stockStatus === 'low' && styles.stockTextLow]}>
              {stockStatus === 'in' && '✅ In Stock'}
              {stockStatus === 'low' && `⚠️ Only ${product.stock} left`}
              {stockStatus === 'out' && '❌ Out of Stock'}
            </Text>
          </View>

          {/* Qty + Add to Cart */}
          {stockStatus !== 'out' && (
            <View style={styles.actionRow}>
              <View style={styles.qtySelector}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.qtyBtn}
                  onPress={decreaseQty}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{qty}</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.qtyBtn}
                  onPress={increaseQty}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.addToCartBtn}
                onPress={handleAddToCart}
              >
                <Text style={styles.addToCartBtnText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Feature Row */}
          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🚚</Text>
              <Text style={styles.featureText}>Free Shipping</Text>
            </View>
            <View style={styles.featureDivider} />
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔄</Text>
              <Text style={styles.featureText}>Easy Returns</Text>
            </View>
            <View style={styles.featureDivider} />
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔒</Text>
              <Text style={styles.featureText}>Secure Pay</Text>
            </View>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabBar}>
            {TABS.map((tab, index) => (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                style={styles.tabItem}
                onLayout={(e) => {
                  tabWidths.current[tab] = e.nativeEvent.layout.width;
                }}
                onPress={() => handleTabPress(tab, index)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
            <Animated.View
              style={[
                styles.tabUnderline,
                { transform: [{ translateX: tabUnderlineX }] },
              ]}
            />
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            <Text style={styles.tabBody}>{tabContent[activeTab]}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      {showStickyBar && stockStatus !== 'out' && (
        <View style={styles.stickyBar}>
          <View style={styles.stickyPriceBlock}>
            <Text style={styles.stickyPrice}>₹{product.price}</Text>
            {hasDiscount && (
              <Text style={styles.stickyCompare}>₹{product.comparePrice}</Text>
            )}
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.stickyCartBtn}
            onPress={handleAddToCart}
          >
            <Text style={styles.stickyCartBtnText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
  },
  errorText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.error,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  backBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.forest,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  backBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.white,
  },
  backNavBtn: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.base,
    zIndex: 10,
    width: 36,
    height: 36,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  backNavIcon: {
    fontSize: 26,
    color: Colors.forestDark,
    lineHeight: 30,
    marginTop: -2,
  },
  scrollContent: {
    paddingBottom: Spacing['2xl'],
  },
  heroImageContainer: {
    height: 260,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 100,
  },
  heroBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.saffron,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  heroBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    color: Colors.white,
  },
  infoSection: {
    backgroundColor: Colors.cream,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.parchment,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.parchmentDark,
  },
  categoryTagText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.sageMid,
  },
  productName: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    color: Colors.forestDark,
    lineHeight: 34,
    marginBottom: Spacing.sm,
  },
  productMeta: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.gray400,
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  mainPrice: {
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    color: Colors.forest,
  },
  comparePrice: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Colors.gray400,
    textDecorationLine: 'line-through',
  },
  discountTag: {
    backgroundColor: Colors.saffronPale,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  discountTagText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.saffron,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.successBg,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  stockBadgeLow: {
    backgroundColor: '#fef3c7',
  },
  stockBadgeOut: {
    backgroundColor: Colors.errorBg,
  },
  stockText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.success,
  },
  stockTextLow: {
    color: '#92400e',
  },
  stockTextOut: {
    color: Colors.error,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchmentDark,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xs,
    height: 48,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  qtyBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    color: Colors.forestDark,
    lineHeight: 24,
  },
  qtyValue: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.forestDark,
    minWidth: 28,
    textAlign: 'center',
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: Colors.forest,
    borderRadius: Radius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  addToCartBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.white,
  },
  featureRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.gray500,
    textAlign: 'center',
  },
  featureDivider: {
    width: 1,
    backgroundColor: Colors.parchmentDark,
    marginVertical: Spacing.xs,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.parchmentDark,
    marginBottom: 0,
    position: 'relative',
  },
  tabItem: {
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.md,
  },
  tabText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.gray400,
  },
  tabTextActive: {
    color: Colors.forestDark,
    fontFamily: Fonts.sansSemiBold,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1.5,
    left: 0,
    width: 80,
    height: 2.5,
    backgroundColor: Colors.forest,
    borderRadius: Radius.full,
  },
  tabContent: {
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xl,
    minHeight: 120,
  },
  tabBody: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.gray700,
    lineHeight: 26,
  },
  stickyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDark,
    ...Shadow.md,
  },
  stickyPriceBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stickyPrice: {
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    color: Colors.forest,
  },
  stickyCompare: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.gray400,
    textDecorationLine: 'line-through',
  },
  stickyCartBtn: {
    backgroundColor: Colors.forest,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    ...Shadow.sm,
  },
  stickyCartBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.white,
  },
});
