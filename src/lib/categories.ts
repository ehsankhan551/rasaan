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
