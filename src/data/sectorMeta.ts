export const sectorMeta: Record<
  string,
  {
    emoji: string;
    displayLabel: string;
    isPopular?: boolean;
  }
> = {
  "Logistics": { emoji: "🚚", displayLabel: "Logistics", isPopular: true },
  "Information Technology": { emoji: "💻", displayLabel: "Tech", isPopular: true },
  "Trading": { emoji: "📦", displayLabel: "Trading", isPopular: true },
  "Construction": { emoji: "🏗", displayLabel: "Construction", isPopular: true },
  "Manufacturing": { emoji: "🏭", displayLabel: "Manufacturing", isPopular: true },
  "Professional Services": { emoji: "📄", displayLabel: "Professional Services", isPopular: true },
  "Healthcare": { emoji: "🏥", displayLabel: "Healthcare", isPopular: true },
  "Hospitality": { emoji: "🌴", displayLabel: "Tourism", isPopular: true },

  "Finance": { emoji: "💰", displayLabel: "Finance" },
  "Real Estate": { emoji: "🏢", displayLabel: "Real Estate" },
  "Education": { emoji: "🎓", displayLabel: "Education" },
  "Energy": { emoji: "⚡", displayLabel: "Energy" },
  "Agriculture": { emoji: "🌾", displayLabel: "Agriculture" },
  "Media": { emoji: "🎬", displayLabel: "Media" },
  "Retail": { emoji: "🛒", displayLabel: "Retail" },
  "Aerospace & Aviation": { emoji: "✈", displayLabel: "Aerospace" },
  "Automotive": { emoji: "🚗", displayLabel: "Automotive" },
  "Telecommunications": { emoji: "📞", displayLabel: "Telecom" },
  "Mining & Quarrying": { emoji: "⚒", displayLabel: "Mining" },
  "Sports & Recreation": { emoji: "🏅", displayLabel: "Sports" }
};
