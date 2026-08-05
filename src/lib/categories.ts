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

// Global, cross-shop department field for Men/Women/Kids/Baby-style browsing
// (Noon.com / Daraz-style top nav), independent of each shop's own category
// list. Most non-apparel products (groceries, electronics, medicine, etc.)
// are "Unisex" — that's the default for new products.
export const DEPARTMENTS = ["Men", "Women", "Kids", "Baby", "Unisex"] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const DEFAULT_DEPARTMENT: Department = "Unisex";

// The shop types a vendor/admin can choose when creating a shop. New store
// categories can be added here at any time as the marketplace grows.
export const SHOP_TYPES = [
  { value: "general", label: "General store" },
  { value: "grocery", label: "Grocery" },
  { value: "food", label: "Food / Restaurant" },
  { value: "bakery", label: "Bakery" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing & Fashion" },
  { value: "shoes", label: "Shoes & Footwear" },
  { value: "cosmetics", label: "Cosmetics & Beauty" },
  { value: "furniture", label: "Furniture & Home" },
  { value: "toys", label: "Toys & Games" },
  { value: "sports", label: "Sports & Fitness" },
  { value: "stationery", label: "Books & Stationery" },
  { value: "hardware", label: "Hardware & Tools" },
  { value: "jewelry", label: "Jewelry & Watches" },
  { value: "pets", label: "Pet Supplies" },
  { value: "mobile", label: "Mobile & Accessories" },
  { value: "other", label: "Other" },
] as const;

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

// Shoe shops get a footwear-specific category list.
export const SHOE_CATEGORIES = [
  "Men's Shoes",
  "Women's Shoes",
  "Kids' Shoes",
  "Sports & Running",
  "Casual & Sneakers",
  "Formal & Dress Shoes",
  "Sandals & Slippers",
  "Boots",
  "Sports Cleats",
  "Shoe Care & Accessories",
  "Other",
] as const;

export type ShoeCategory = (typeof SHOE_CATEGORIES)[number];

export const DEFAULT_SHOE_CATEGORY: ShoeCategory = "Other";

// Cosmetics shops get a beauty-specific category list.
export const COSMETICS_CATEGORIES = [
  "Makeup",
  "Skincare",
  "Haircare",
  "Fragrances",
  "Nail Care",
  "Bath & Body",
  "Men's Grooming",
  "Beauty Tools & Accessories",
  "Organic & Herbal",
  "Other",
] as const;

export type CosmeticsCategory = (typeof COSMETICS_CATEGORIES)[number];

export const DEFAULT_COSMETICS_CATEGORY: CosmeticsCategory = "Other";

// Maps a shop's own type (shops.category, e.g. "pharmacy", "grocery") to the
// product-category list vendors/admins should pick from for that shop's
// products. Falls back to the generic marketplace list for shop types that
// don't have a dedicated list yet.
export function getCategoriesForShopType(shopType: string | null | undefined): readonly string[] {
  switch ((shopType || "").toLowerCase()) {
    case "pharmacy":
      return PHARMACY_CATEGORIES;
    case "shoes":
      return SHOE_CATEGORIES;
    case "cosmetics":
      return COSMETICS_CATEGORIES;
    default:
      return PRODUCT_CATEGORIES;
  }
}

export function getDefaultCategoryForShopType(shopType: string | null | undefined): string {
  switch ((shopType || "").toLowerCase()) {
    case "pharmacy":
      return DEFAULT_PHARMACY_CATEGORY;
    case "shoes":
      return DEFAULT_SHOE_CATEGORY;
    case "cosmetics":
      return DEFAULT_COSMETICS_CATEGORY;
    default:
      return DEFAULT_PRODUCT_CATEGORY;
  }
}
