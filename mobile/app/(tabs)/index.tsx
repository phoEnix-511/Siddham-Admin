import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Dimensions, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, Product, Category } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { Colors, Spacing, Radius, Shadow, Fonts } from '../../constants/colors';

const { width } = Dimensions.get('window');

const CATEGORY_ICONS: Record<string, string> = {
  'hair-care': '💆',
  'supplements': '💊',
  'skin-care': '✨',
  'oils-essentials': '🌿',
  'ayurvedic-herbal-formulation': '🍶',
  'ayurvedic-proprietary-medicine': '💊',
  'ayurvedic-formulation': '🍯',
};

function HeroSection() {
  const router = useRouter();
  return (
    <View style={styles.hero}>
      <View style={styles.heroContent}>
        <Text style={styles.heroEyebrow}>🌿  Ayurveda · Since Ancient Times</Text>
        <Text style={styles.heroTitle}>Heal Naturally.{'\n'}Live Wholly.</Text>
        <Text style={styles.heroSubtitle}>
          Authentic Ayurvedic formulations, crafted from nature's finest herbs.
        </Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.btnGold} onPress={() => router.push('/(tabs)/shop')}>
            <Text style={styles.btnGoldText}>Explore Products →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnOutline} onPress={() => router.push('/(tabs)/about')}>
            <Text style={styles.btnOutlineText}>Our Story</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.heroDecor}>
        <Text style={styles.heroDecorEmoji}>🌿</Text>
      </View>
    </View>
  );
}

function TrustBar() {
  const items = [
    { icon: '🌿', text: '100% Natural' },
    { icon: '🔬', text: 'Lab Tested' },
    { icon: '🚚', text: 'Free Ship ₹999+' },
    { icon: '🏆', text: 'GMP Certified' },
  ];
  return (
    <View style={styles.trustBar}>
      {items.map((item, i) => (
        <View key={i} style={styles.trustItem}>
          <Text style={styles.trustIcon}>{item.icon}</Text>
          <Text style={styles.trustText}>{item.text}</Text>
        </View>
      ))}
    </View>
  );
}

function CategoryCard({ category, onPress }: { category: Category; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.catCard} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.catIcon}>{CATEGORY_ICONS[category.slug] || '🌿'}</Text>
      <Text style={styles.catName}>{category.name}</Text>
      <Text style={styles.catCount}>{category._count.products} Products</Text>
    </TouchableOpacity>
  );
}

function ProductCard({ product, onPress, onAdd }: {
  product: Product; onPress: () => void; onAdd: () => void;
}) {
  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;
  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.productImage}>
        <Text style={styles.productEmoji}>{CATEGORY_ICONS[product.category.slug] || '🌿'}</Text>
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
      </View>
      <View style={styles.productBody}>
        <Text style={styles.productCategory}>{product.category.name}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceMain}>₹{product.price}</Text>
          {product.comparePrice && <Text style={styles.priceCompare}>₹{product.comparePrice}</Text>}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { addItem } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.products.list({ featured: true, limit: 6 }),
      api.categories.list(),
    ]).then(([pd, cd]) => {
      setFeaturedProducts(pd.products);
      setCategories(cd.categories);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <HeroSection />
      <TrustBar />

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.eyebrow}>SHOP BY CATEGORY</Text>
        <Text style={styles.sectionTitle}>What Are You Looking For?</Text>
        {loading ? (
          <ActivityIndicator color={Colors.saffron} size="large" style={{ marginVertical: 32 }} />
        ) : (
          <FlatList
            data={categories}
            keyExtractor={c => c.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: 12 }}
            renderItem={({ item }) => (
              <CategoryCard
                category={item}
                onPress={() => router.push({ pathname: '/(tabs)/shop', params: { category: item.slug } })}
              />
            )}
          />
        )}
      </View>

      {/* Featured Products */}
      <View style={[styles.section, { backgroundColor: Colors.white }]}>
        <Text style={styles.eyebrow}>BESTSELLERS</Text>
        <Text style={styles.sectionTitle}>Our Signature Products</Text>
        {loading ? (
          <ActivityIndicator color={Colors.saffron} size="large" style={{ marginVertical: 32 }} />
        ) : (
          <FlatList
            data={featuredProducts}
            keyExtractor={p => p.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: 12 }}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onPress={() => router.push(`/product/${item.id}`)}
                onAdd={() => addItem({
                  productId: item.id,
                  name: item.name,
                  price: item.price,
                  stock: item.stock,
                })}
              />
            )}
          />
        )}
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => router.push('/(tabs)/shop')}
        >
          <Text style={styles.viewAllText}>View All Products →</Text>
        </TouchableOpacity>
      </View>

      {/* Brand Story */}
      <View style={styles.brandSection}>
        <Text style={styles.brandEyebrow}>OUR PHILOSOPHY</Text>
        <Text style={styles.brandTitle}>Where Ancient Science{'\n'}Meets Modern Life</Text>
        <Text style={styles.brandBody}>
          At Siddham Wellness, we believe that true health is a balance of mind, body, and spirit.
          Our products are rooted in the 5,000-year tradition of Ayurveda — using herbs trusted for generations.
        </Text>
        <View style={styles.statsGrid}>
          {[
            { num: '5000+', label: 'Years of Wisdom' },
            { num: '50+', label: 'Herbal Ingredients' },
            { num: '10K+', label: 'Happy Customers' },
            { num: '100%', label: 'Natural & Safe' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom padding for tab bar */}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const CARD_W = (width - Spacing.base * 2 - 12) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },

  // Hero
  hero: {
    backgroundColor: Colors.forest,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: Spacing.base,
    overflow: 'hidden',
  },
  heroContent: { flex: 1 },
  heroEyebrow: {
    color: Colors.saffronLight,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: Fonts.serif,
    fontSize: 40,
    color: Colors.parchment,
    lineHeight: 48,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: 'rgba(248,244,238,0.75)',
    lineHeight: 24,
    marginBottom: 28,
  },
  heroActions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  heroDecor: {
    position: 'absolute',
    right: 20,
    top: 40,
    opacity: 0.15,
  },
  heroDecorEmoji: { fontSize: 100 },
  btnGold: {
    backgroundColor: Colors.saffron,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  btnGoldText: { color: Colors.white, fontFamily: Fonts.sansBold, fontSize: 14 },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: Colors.saffronLight,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  btnOutlineText: { color: Colors.saffronLight, fontFamily: Fonts.sansSemiBold, fontSize: 14 },

  // Trust bar
  trustBar: {
    backgroundColor: Colors.parchmentDark,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  trustItem: { alignItems: 'center', gap: 4 },
  trustIcon: { fontSize: 18 },
  trustText: { fontSize: 10, fontFamily: Fonts.sansSemiBold, color: Colors.forest },

  // Sections
  section: {
    paddingVertical: Spacing['2xl'],
    backgroundColor: Colors.cream,
  },
  eyebrow: {
    textAlign: 'center',
    color: Colors.saffron,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  sectionTitle: {
    textAlign: 'center',
    fontFamily: Fonts.serif,
    fontSize: 24,
    color: Colors.forestDark,
    marginBottom: 20,
    paddingHorizontal: Spacing.base,
  },

  // Category card
  catCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: 20,
    alignItems: 'center',
    width: 110,
    ...Shadow.sm,
  },
  catIcon: { fontSize: 32, marginBottom: 8 },
  catName: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.forestDark, textAlign: 'center' },
  catCount: { fontSize: 11, color: Colors.gray500, marginTop: 2 },

  // Product card
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    width: CARD_W,
    ...Shadow.sm,
  },
  productImage: {
    backgroundColor: Colors.parchment,
    height: CARD_W * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productEmoji: { fontSize: 50 },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.saffron,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: { color: Colors.white, fontSize: 10, fontFamily: Fonts.sansBold },
  productBody: { padding: 12 },
  productCategory: { fontSize: 10, fontFamily: Fonts.sansSemiBold, color: Colors.sage, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  productName: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.forestDark, lineHeight: 18, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  priceMain: { fontFamily: Fonts.sansBold, fontSize: 16, color: Colors.forest },
  priceCompare: { fontSize: 12, color: Colors.gray400, textDecorationLine: 'line-through' },
  addBtn: {
    backgroundColor: Colors.forest,
    borderRadius: Radius.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addBtnText: { color: Colors.white, fontFamily: Fonts.sansSemiBold, fontSize: 12 },

  // View all
  viewAllBtn: {
    borderWidth: 1.5,
    borderColor: Colors.forest,
    marginHorizontal: Spacing.base,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  viewAllText: { color: Colors.forest, fontFamily: Fonts.sansSemiBold, fontSize: 14 },

  // Brand section
  brandSection: {
    backgroundColor: Colors.forest,
    padding: Spacing['2xl'],
  },
  brandEyebrow: {
    color: Colors.saffronLight,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  brandTitle: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    color: Colors.parchment,
    lineHeight: 34,
    marginBottom: 16,
  },
  brandBody: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: 'rgba(248,244,238,0.75)',
    lineHeight: 22,
    marginBottom: 24,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    backgroundColor: 'rgba(248,244,238,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(196,133,42,0.2)',
    borderRadius: Radius.lg,
    padding: 16,
    width: (width - Spacing['2xl'] * 2 - 12) / 2,
    alignItems: 'center',
  },
  statNum: { fontFamily: Fonts.serif, fontSize: 26, color: Colors.saffronLight, marginBottom: 4 },
  statLabel: { fontSize: 11, color: 'rgba(248,244,238,0.6)', fontFamily: Fonts.sans, textAlign: 'center' },
});
