export const PRODUCT_CATEGORIES = [
  'Utilidades Domésticas',
  'Ferramentas',
  'Cozinha',
  'Casa & Organização',
  'Eletrônicos',
  'Automotivo',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const STOREFRONT_CATEGORIES = ['Todos', ...PRODUCT_CATEGORIES] as const;
export type StorefrontCategory = (typeof STOREFRONT_CATEGORIES)[number];

export const BADGE_PRESETS = [
  'Oferta Quente',
  'Frete Full',
  'Mais Vendido',
] as const;

export const STORAGE_BUCKET_NAME = 'vitrine-images';

export const BRAND_LOGO_URL = `${import.meta.env.BASE_URL}assets/aistudio/916955676_122101487973552338_1821197092919286698_n_f2318c19.jpg`;

export interface Product {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price: string;
  old_price: string | null;
  badge: string | null;
  image_url: string;
  affiliate_url: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ProductInput {
  title: string;
  description: string;
  category: string;
  price: string;
  old_price: string | null;
  badge: string | null;
  image_url: string;
  affiliate_url: string;
  is_active: boolean;
  is_featured: boolean;
}
