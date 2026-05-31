import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../constants/colors';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';
import type { Category, Product } from '../../services/api';

const CATEGORY_ICONS: Record<string, string> = {
  'hair-care': '💆',
  'supplements': '💊',
  'skin-care': '✨',
  'oils-essentials': '🌿',
};

const NUM_COLUMNS = 2;

export default function ShopScreen() {
  const router = useRouter();
  const { category: routeCategory } = useLocalSearchParams<{ category?: string }>();
  const { count, addItem } = useCart();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(routeCategory ?? 'all');

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(text), 500);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Update selected category from deep-link params
  useEffect(() => {
    if (routeCategory) setSelectedCategory(routeCategory);
  }, [routeCategory]);

  // Fetch categories once
  useEffect(() => {
    (async () => {
      try {
        const data = await api.categories.list();
        setCategories(data);
      } catch {
        // non-fatal; show all products
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);
    setError(null);

    const params: Record<string, string> = {};
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

    api.products
      .list(params)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load products. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, debouncedSearch]);

  const handleAddToCart = useCallback(
    (product: Product) => {
      addItem(product, 1);
    },
    [addItem],
  );

  const renderProductCard = useCallback(
    ({ item }: { item: Product }) => {
      const hasDiscount =
        item.comparePrice != null && item.comparePrice > item.price;
      const discountPct = hasDiscount
        ? Math.round(((item.comparePrice! - item.price) / item.comparePrice!) * 100)
        : 0;
      const categoryIcon =
        CATEGORY_ICONS[item.category?.slug ?? ''] ?? '🌿';

      return (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.card}
          onPress={() => router.push(`/product/${item.id}`)}
        >
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{discountPct}% OFF</Text>
            </View>
          )}
          <View style={styles.cardEmoji}>
            <Text style={styles.cardEmojiText}>{categoryIcon}</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardName} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.cardPrice}>₹{item.price}</Text>
              {hasDiscount && (
                <Text style={styles.cardComparePrice}>₹{item.comparePrice}</Text>
              )}
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.addBtn}
              onPress={() => handleAddToCart(item)}
            >
              <Text style={styles.addBtnText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    },
    [handleAddToCart, router],
  );

  const allChips: { slug: string; label: string; icon: string }[] = [
    { slug: 'all', label: 'All', icon: '🛍️' },
    ...categories.map((c) => ({
      slug: c.slug,
      label: c.name,
      icon: CATEGORY_ICONS[c.slug] ?? '🌿',
    })),
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.cartBtn}
          onPress={() => router.push('/(tabs)/cart')}
        >
          <Text style={styles.cartIcon}>🛒</Text>
          {count > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{count > 99 ? '99+' : count}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products…"
          placeholderTextColor={Colors.gray400}
          value={search}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Category Chips */}
      {!loadingCategories && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {allChips.map((chip) => {
            const active = selectedCategory === chip.slug;
            return (
              <TouchableOpacity
                key={chip.slug}
                activeOpacity={0.8}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedCategory(chip.slug)}
              >
                <Text style={styles.chipIcon}>{chip.icon}</Text>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Product Grid */}
      {loadingProducts ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.forest} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProductCard}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>
                Try a different search or category.
              </Text>
            </View>
          }
        />
      )}
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
  cartBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.saffron,
    borderRadius: Radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    color: Colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.gray800,
  },
  chipsContainer: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDark,
    ...Shadow.sm,
  },
  chipActive: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forest,
  },
  chipIcon: {
    fontSize: 13,
    marginRight: Spacing.xs,
  },
  chipText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.gray700,
  },
  chipTextActive: {
    color: Colors.white,
  },
  gridContent: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  card: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.md,
  },
  discountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 1,
    backgroundColor: Colors.saffron,
    borderRadius: Radius.sm,
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs + 2,
  },
  discountBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    color: Colors.white,
  },
  cardEmoji: {
    height: 110,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmojiText: {
    fontSize: 52,
  },
  cardBody: {
    padding: Spacing.md,
  },
  cardName: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.forestDark,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardPrice: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    color: Colors.forest,
  },
  cardComparePrice: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.gray400,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    backgroundColor: Colors.forest,
    borderRadius: Radius.md,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
  },
  addBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.white,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  errorText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.error,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 18,
    color: Colors.forestDark,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.gray500,
    textAlign: 'center',
  },
});
