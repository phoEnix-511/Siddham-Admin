import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../constants/colors';

const STATS = [
  { value: '5000+', label: 'Years' },
  { value: '50+', label: 'Ingredients' },
  { value: '10K+', label: 'Customers' },
  { value: '100%', label: 'Natural' },
];

const VALUES = [
  {
    icon: '🌿',
    title: 'Natural Purity',
    desc: 'Every ingredient is sourced in its purest form, free from synthetic additives and harmful chemicals.',
  },
  {
    icon: '🔬',
    title: 'Science-Backed',
    desc: 'Ancient Ayurvedic formulations are validated through modern research and clinical insights.',
  },
  {
    icon: '🤝',
    title: 'Ethical Sourcing',
    desc: 'We partner with trusted farmers who practice sustainable and cruelty-free methods.',
  },
];

const CATEGORIES = [
  { icon: '💆', name: 'Hair Care', desc: 'Herbal oils and serums for strong, lustrous hair.' },
  { icon: '✨', name: 'Skin Care', desc: 'Natural formulas that nourish and protect your skin.' },
  { icon: '💊', name: 'Supplements', desc: 'Ayurvedic capsules and powders for daily wellness.' },
  { icon: '🌿', name: 'Oils & Essentials', desc: 'Pure essential oils and carrier blends.' },
];

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Est. 2020</Text>
          </View>
          <Text style={styles.heroLeaf}>🌿</Text>
          <Text style={styles.heroTitle}>Siddham Wellness</Text>
          <Text style={styles.heroTagline}>
            Rooted in Tradition. Backed by Science.{'\n'}Crafted for You.
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsCard}>
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.label}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
              {i < STATS.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Mission Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHO WE ARE</Text>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionBody}>
            At Siddham Wellness, we believe that true health is a harmony of mind, body,
            and spirit. Inspired by the 5,000-year-old wisdom of Ayurveda, our mission is
            to bring authentic, time-tested remedies into the modern world. We bridge the
            gap between ancient herbal traditions and contemporary lifestyles, making
            wellness accessible, effective, and deeply rooted in nature.
          </Text>
          <Text style={styles.sectionBody}>
            Every product we create is a tribute to the Siddham way — pure, powerful, and
            purposeful. We work directly with certified herbalists and Ayurvedic experts
            to ensure that every formulation upholds the highest standards of quality and
            efficacy.
          </Text>
        </View>

        {/* Values Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHAT WE STAND FOR</Text>
          <Text style={styles.sectionTitle}>Our Values</Text>
          <View style={styles.valuesGrid}>
            {VALUES.map((v) => (
              <View key={v.title} style={styles.valueCard}>
                <View style={styles.valueIconWrap}>
                  <Text style={styles.valueIcon}>{v.icon}</Text>
                </View>
                <Text style={styles.valueTitle}>{v.title}</Text>
                <Text style={styles.valueDesc}>{v.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Products Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHAT WE OFFER</Text>
          <Text style={styles.sectionTitle}>Our Collections</Text>
          <Text style={styles.sectionBody}>
            Explore our curated range of Ayurvedic products, each designed to address
            specific wellness needs with the power of nature.
          </Text>
          {CATEGORIES.map((cat) => (
            <View key={cat.name} style={styles.categoryRow}>
              <View style={styles.categoryIconWrap}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryDesc}>{cat.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Contact Footer */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Get in Touch</Text>
          <Text style={styles.contactSubtitle}>
            Have questions or need guidance? Our wellness experts are here to help.
          </Text>
          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>📧</Text>
            <Text style={styles.contactText}>hello@siddhamwellness.com</Text>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>📞</Text>
            <Text style={styles.contactText}>+91 98765 43210</Text>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>📍</Text>
            <Text style={styles.contactText}>
              Bengaluru, Karnataka, India — 560001
            </Text>
          </View>
          <View style={styles.socialRow}>
            <TouchableOpacity activeOpacity={0.8} style={styles.socialBtn}>
              <Text style={styles.socialBtnText}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={styles.socialBtn}>
              <Text style={styles.socialBtnText}>Facebook</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} Siddham Wellness. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    paddingBottom: Spacing['2xl'],
  },
  hero: {
    backgroundColor: Colors.forestDark,
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['2xl'] + Spacing.base,
    paddingHorizontal: Spacing.xl,
  },
  heroBadge: {
    backgroundColor: Colors.saffron,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.base,
  },
  heroBadgeText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.white,
    letterSpacing: 1,
  },
  heroLeaf: {
    fontSize: 52,
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    color: Colors.white,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  heroTagline: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.saffronPale,
    textAlign: 'center',
    lineHeight: 24,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: -Spacing.xl,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.sm,
    ...Shadow.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.forest,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.gray500,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.parchmentDark,
    marginVertical: Spacing.xs,
  },
  section: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['2xl'],
  },
  sectionLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    color: Colors.saffron,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    color: Colors.forestDark,
    marginBottom: Spacing.md,
  },
  sectionBody: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.gray700,
    lineHeight: 26,
    marginBottom: Spacing.md,
  },
  valuesGrid: {
    gap: Spacing.md,
  },
  valueCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  valueIconWrap: {
    width: 44,
    height: 44,
    backgroundColor: Colors.parchment,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  valueIcon: {
    fontSize: 22,
  },
  valueTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.forestDark,
    marginBottom: Spacing.xs,
  },
  valueDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.gray500,
    lineHeight: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    backgroundColor: Colors.parchment,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryIcon: {
    fontSize: 22,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.forestDark,
    marginBottom: 4,
  },
  categoryDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.gray500,
    lineHeight: 19,
  },
  contactCard: {
    backgroundColor: Colors.forestDark,
    marginHorizontal: Spacing.base,
    marginTop: Spacing['2xl'],
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  contactTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  contactSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.saffronPale,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    alignSelf: 'flex-start',
  },
  contactIcon: {
    fontSize: 16,
  },
  contactText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.saffronPale,
    flexShrink: 1,
  },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.base,
  },
  socialBtn: {
    borderWidth: 1,
    borderColor: Colors.saffron,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
  },
  socialBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.saffronLight,
  },
  copyright: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.sageMid,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
