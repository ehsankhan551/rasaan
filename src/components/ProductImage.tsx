import { getSafeImageUrl, categoryIconKey, type IconKey } from "@/lib/productImage";

const ICON_PATHS: Record<IconKey, React.ReactNode> = {
  produce: (
    <path d="M12 3c-1 2-3 2.5-3 5 0 2.8 2.2 5 5 5s5-2.2 5-5c0-.5-.1-1-.3-1.4M9 8C5 8 3 11 3 15c0 4 3 7 7 7 2 0 3-.7 4-.7s2 .7 4 .7c1 0 1.8-.2 2.5-.6" />
  ),
  groceries: (
    <path d="M6 8h12l-1 12H7L6 8Zm2 0V6a4 4 0 0 1 8 0v2" />
  ),
  pharmacy: (
    <path d="M12 4v16M4 12h16M7 4h10a2 2 0 0 1 2 2v3H5V6a2 2 0 0 1 2-2Z" />
  ),
  shoes: (
    <path d="M3 17c0-2 2-3 4-4l6-3c1.5-.7 2-1 3-1s2 .5 2 2v3c2 0 3 1 3 3v3H3v-3Z" />
  ),
  fashion: (
    <path d="M9 4l3 2 3-2 4 3-2 3-2-1v9H8v-9l-2 1-2-3 5-3Z" />
  ),
  electronics: (
    <path d="M4 5h16v10H4V5Zm4 14h8M9 15v4m6-4v4" />
  ),
  cosmetics: (
    <path d="M9 3h6l1 4H8l1-4Zm-2 4h10l1 14H6L7 7Z" />
  ),
  home: (
    <path d="M4 11l8-7 8 7M6 10v10h12V10" />
  ),
  baby: (
    <path d="M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-7 9c0-3 3-5 7-5s7 2 7 5v7H5v-7Z" />
  ),
  generic: (
    <path d="M4 5h16v14H4V5Zm3 10 3.5-4.5 2.5 3L16 9l4 6H4l3-4Z" />
  ),
};

/**
 * Renders a product photo when we have a genuine one, or a clean category
 * icon placeholder when we don't — instead of falling back to a random
 * stock photo of an unrelated item (see lib/productImage.ts for why).
 */
export default function ProductImage({
  src,
  category,
  name,
  imgClassName = "w-full h-full object-cover",
  wrapperClassName = "",
}: {
  src?: string | null;
  category?: string | null;
  name: string;
  imgClassName?: string;
  wrapperClassName?: string;
}) {
  const safeSrc = getSafeImageUrl(src);

  if (safeSrc) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={safeSrc} alt={name} className={imgClassName} loading="lazy" />;
  }

  const key = categoryIconKey(category);
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-300 ${wrapperClassName}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-9 w-9"
      >
        {ICON_PATHS[key]}
      </svg>
      <span className="px-2 text-center text-[10px] font-medium text-gray-400 line-clamp-1">
        {category || "No image yet"}
      </span>
    </div>
  );
}
