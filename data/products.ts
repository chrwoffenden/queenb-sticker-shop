export type Product = {
  id: number;
  name: string;
  category: "Sticker" | "Theme";
  image: string;
  previewImages: string[];
  regularPrice: number;
  salePrice?: number;
  promotionEnd?: string;
  slug: string;
  isBestSeller: boolean;
};

export const products: Product[] = [
  {
    id: 1,
    name: "Berry Bunny Sticker",
    category: "Sticker",
    image: "/products/berry-bunny.png",
    previewImages: [
      "/products/berry-bunny.png",
      "/products/berry-bunny-preview-1.png",
      "/products/berry-bunny-preview-2.png",
      "/products/berry-bunny-preview-3.png",
    ],
    regularPrice: 45,
    salePrice: 35,
    promotionEnd: "2026-06-30",
    slug: "berry-bunny-sticker",
    isBestSeller: true,
  },
  {
    id: 2,
    name: "Peachy Girl Picnic",
    category: "Theme",
    image:
      "https://placehold.co/600x600/fff0d9/bc7658?text=Peachy+Girl",
    previewImages: [
      "https://placehold.co/900x900/fff0d9/bc7658?text=Peachy+Girl+Cover",
      "https://placehold.co/900x900/ffe4d4/bc7658?text=Chat+Preview",
      "https://placehold.co/900x900/fff4e6/bc7658?text=Home+Preview",
    ],
    regularPrice: 59,
    salePrice: 49,
    promotionEnd: "2026-06-30",
    slug: "peachy-girl-picnic",
    isBestSeller: true,
  },
  {
    id: 3,
    name: "Minty Forest Friends",
    category: "Theme",
    image:
      "https://placehold.co/600x600/e4f4e8/5f8b72?text=Minty+Forest",
    previewImages: [
      "https://placehold.co/900x900/e4f4e8/5f8b72?text=Minty+Forest+Cover",
      "https://placehold.co/900x900/daf0e1/5f8b72?text=Chat+Preview",
      "https://placehold.co/900x900/edf8ef/5f8b72?text=Menu+Preview",
    ],
    regularPrice: 59,
    slug: "minty-forest-friends",
    isBestSeller: false,
  },
  {
    id: 4,
    name: "Moonlight Bunny Café",
    category: "Theme",
    image:
      "https://placehold.co/600x600/eee8ff/74689f?text=Moonlight+Bunny",
    previewImages: [
      "https://placehold.co/900x900/eee8ff/74689f?text=Moonlight+Bunny+Cover",
      "https://placehold.co/900x900/e5ddff/74689f?text=Chat+Preview",
      "https://placehold.co/900x900/f5f1ff/74689f?text=Home+Preview",
    ],
    regularPrice: 59,
    salePrice: 45,
    promotionEnd: "2026-07-15",
    slug: "moonlight-bunny-cafe",
    isBestSeller: false,
  },
];
