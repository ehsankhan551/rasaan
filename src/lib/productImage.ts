// A large share of the catalog was bulk-seeded with generic stock photos
// (sourced from Wikimedia Commons) used as category filler images. Because
// the exact same photo was reused across dozens or even hundreds of
// unrelated products (e.g. the same "potato" photo appearing on cornflakes,
// sugar, and pickle jars), these images actively misrepresent the specific
// product a shopper is looking at.
//
// Rather than keep showing a photo that isn't of the product, every URL
// below is treated as "no image available" and callers should render an
// honest category placeholder instead (see components/ProductImage.tsx).
const REUSED_PLACEHOLDER_URLS = new Set(
  [
    "https://upload.wikimedia.org/wikipedia/commons/e/e2/Pharmacy_Green_Cross.png",
    "https://upload.wikimedia.org/wikipedia/commons/1/18/Pills_in_blister_pack.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/04/Girl_in_salwar_kameez.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Potato.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/57/Tube_of_hydrocortisone_cream.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3b/Android_Samsung_Smartphones.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/f2/Sirop_toux.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/33/Ocuheel_Medication.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/57/Antibiotic_pills.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/7/7b/Classical_polo_shirt.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/c/cf/Loake_Ledbury_oxford_shoes.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3e/Dettol_products_to_review.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/5e/Kurta_-_Mens.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/21/Nokia_mobile_phone_USB_charging_cable_-_20130310.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/60/Denim_Jeans_Pant_Display.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/c/c6/Johnsons_Baby_Powder_1,5_OZS_talc,_pic1.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/7/70/22-07-2017_Carton_of_UHT_Milk_of_Matinal_brand.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/8/8b/Headphones.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/17/Phone-case.png",
    "https://upload.wikimedia.org/wikipedia/commons/1/13/Bottle_of_olive_oil.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/d3/Biscuit.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/87/Sneaker.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/04/Ampoule_pharmaceutique.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/9/99/Chocolate_cake_(1).jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Coca-cola_bottle.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/e/e2/LG_smart_TV.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/67/JBL_Flip_3_bluetooth_speaker_(DSCF2653).jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4e/Anker_power_bank_lit.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/a1/Fresh_made_bread_06.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/0e/Smartwatch.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/69/Potato-Chips.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/ad/Tea_bag.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/d/d6/A-first-aid-kit.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/fd/Digital_thermometer.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/5c/AsthmaInhaler.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/b/b5/Laundry_detergent_pods.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/55/White_electric_kettle.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/a/a0/TP-Link_WR841ND_WiFi_router_transparent.png",
    "https://upload.wikimedia.org/wikipedia/commons/c/c8/Oral_rehydration_salts_(ORS)_-_Packet.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4a/KitchenAid_Stand_Mixer.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/9f/Electric_steam_iron.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/c/c7/Vitamin_D_pills.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Nivea_Creme.webp",
    "https://upload.wikimedia.org/wikipedia/commons/a/ae/Basmati_Rice_Kolkata_2011-02-11_1054.JPG",
  ].map((u) => u.trim())
);

/** Returns a trimmed, usable image URL, or null if there is none / it's a known bulk-reused placeholder. */
export function getSafeImageUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (REUSED_PLACEHOLDER_URLS.has(trimmed)) return null;
  return trimmed;
}

export type IconKey =
  | "produce"
  | "groceries"
  | "pharmacy"
  | "shoes"
  | "fashion"
  | "electronics"
  | "cosmetics"
  | "home"
  | "baby"
  | "generic";

/** Maps a free-text product/department category to one of a small set of icon buckets. */
export function categoryIconKey(category?: string | null): IconKey {
  const c = (category || "").toLowerCase();
  if (/(fruit|vegetable|produce)/.test(c)) return "produce";
  if (/(grocer|food|snack|beverage|bakery|dairy|rice|spice|tea|drink)/.test(c)) return "groceries";
  if (/(pharma|medic|health|otc|supplement|tablet|syrup)/.test(c)) return "pharmacy";
  if (/(shoe|sneaker|sandal|boot|footwear)/.test(c)) return "shoes";
  if (/(cloth|apparel|fashion|kurta|shirt|dress|suit|jean)/.test(c)) return "fashion";
  if (/(electronic|mobile|phone|laptop|tv|speaker|charger|gadget|accessor)/.test(c)) return "electronics";
  if (/(cosmetic|beauty|makeup|skincare|perfume)/.test(c)) return "cosmetics";
  if (/(home|kitchen|appliance|furniture)/.test(c)) return "home";
  if (/(baby|infant)/.test(c)) return "baby";
  return "generic";
}
