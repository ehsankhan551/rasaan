export const PRODUCT_CATEGORIES = [
  "Groceries",
  "Cosmetics & Beauty",
  "Medicine & Health",
  "Bakery & Sweets",
  "Fruits & Vegetables",
  "Electronics",
  "Clothing & Fashion",
  "Home & Kitchen",
  "Books & Stationery",
  "Mobile Accessories",
  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const DEFAULT_PRODUCT_CATEGORY: ProductCategory = "Other";

// Pharmacy shops get a dedicated, medicine-specific category list instead of
// the generic marketplace categories above.
export const PHARMACY_CATEGORIES = [
  "Pain Relief & Fever",
  "Antibiotics",
  "Cough, Cold & Flu",
  "Allergy",
  "Digestive Health & Antacids",
  "Vitamins & Supplements",
  "Diabetes Care",
  "Cardiac & Blood Pressure",
  "Skin Care & Dermatology",
  "Eye & Ear Care",
  "Women's Health",
  "Baby & Mother Care",
  "First Aid & Wound Care",
  "Respiratory & Asthma",
  "Neuro & Mental Health",
  "Herbal & Homeopathic",
  "Medical Devices & Equipment",
  "Personal Care & Hygiene",
  "Other",
] as const;

export type PharmacyCategory = (typeof PHARMACY_CATEGORIES)[number];

export const DEFAULT_PHARMACY_CATEGORY: PharmacyCategory = "Other";

// Maps a shop's own type (shops.category, e.g. "pharmacy", "grocery") to the
// product-category list vendors/admins should pick from for that shop's
// products. Falls back to the generic marketplace list for shop types that
// don't have a dedicated list yet.
export function getCategoriesForShopType(shopType: string | null | undefined): readonly string[] {
  switch ((shopType || "").toLowerCase()) {
    case "pharmacy":
      return PHARMACY_CATEGORIES;
    default:
      return PRODUCT_CATEGORIES;
  }
}

export function getDefaultCategoryForShopType(shopType: string | null | undefined): string {
  switch ((shopType || "").toLowerCase()) {
    case "pharmacy":
      return DEFAULT_PHARMACY_CATEGORY;
    default:
      return DEFAULT_PRODUCT_CATEGORY;
  }
}
