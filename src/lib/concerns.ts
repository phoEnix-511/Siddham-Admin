export interface ConcernCategory {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

export const CONCERN_CATEGORIES: ConcernCategory[] = [
  {
    name: "Brain Wellness",
    slug: "brain-wellness",
    description: "Brain wellness support",
  },
  {
    name: "Cardiac Wellness",
    slug: "cardiac-wellness",
    description: "Cardiac wellness support",
  },
  {
    name: "Daily Wellness",
    slug: "daily-wellness",
    description: "Daily wellness support",
  },
  {
    name: "Diabetic Wellness",
    slug: "diabetic-wellness",
    description: "Diabetic wellness support",
  },
  {
    name: "Digestive Wellness",
    slug: "digestive-wellness",
    description: "Digestive wellness support",
  },
  {
    name: "Hair Wellness",
    slug: "hair-wellness",
    description: "Hair wellness support",
  },
  {
    name: "Immunity Wellness",
    slug: "immunity-wellness",
    description: "Immunity wellness support",
  },
  {
    name: "Kidney Wellness",
    slug: "kidney-wellness",
    description: "Kidney wellness support",
  },
  {
    name: "Liver Wellness",
    slug: "liver-wellness",
    description: "Liver wellness support",
  },
  {
    name: "Men's Wellness",
    slug: "mens-wellness",
    description: "Men wellness support",
  },
  {
    name: "Pain Reliever",
    slug: "pain-reliever",
    description: "Pain relief support",
  },
  {
    name: "Skin Wellness",
    slug: "skin-wellness",
    description: "Skin wellness support",
  },
  {
    name: "Stamina Booster",
    slug: "stamina-booster",
    description: "Stamina support",
  },
  {
    name: "Women's Wellness",
    slug: "womens-wellness",
    description: "Women wellness support",
  },
  {
    name: "Blood Purify",
    slug: "blood-purify",
    description: "Blood purification support",
  },
];

export const CONCERN_ICONS: Record<string, string> = Object.fromEntries(
  CONCERN_CATEGORIES.map((concern) => [
    concern.slug,
    concern.slug.includes("hair")
      ? "💆"
      : concern.slug.includes("skin")
        ? "✨"
        : concern.slug.includes("brain")
          ? "🧠"
          : concern.slug.includes("cardiac")
            ? "❤️"
            : concern.slug.includes("daily")
              ? "🌟"
              : concern.slug.includes("diabetic")
                ? "🩸"
                : concern.slug.includes("digestive")
                  ? "🥣"
                  : concern.slug.includes("immunity")
                    ? "🛡️"
                    : concern.slug.includes("kidney")
                      ? "💧"
                      : concern.slug.includes("liver")
                        ? "🍃"
                        : concern.slug.includes("mens")
                          ? "💪"
                          : concern.slug.includes("pain")
                            ? "🔥"
                            : concern.slug.includes("stamina")
                              ? "⚡"
                              : concern.slug.includes("women")
                                ? "🌺"
                                : concern.slug.includes("blood")
                                  ? "🍷"
                                  : "🌿",
  ]),
);

export function getConcernCategory(slug: string): ConcernCategory | undefined {
  return CONCERN_CATEGORIES.find((concern) => concern.slug === slug);
}
