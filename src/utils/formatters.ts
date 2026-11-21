import { STORAGE_BUCKET_NAME } from '../types/product';

/**
 * Validates and normalizes an external HTTP/HTTPS URL, blocking unsafe schemes
 * like javascript:, data:, or vbscript:.
 */
export function sanitizeHttpUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parses a Brazilian currency string (e.g. "R$ 49,90" or "1.299,00") into a number.
 */
export function parseBrlPrice(value: string | null | undefined): number | null {
  if (!value) return null;
  const cleaned = value
    .replace(/R\$/gi, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Calculates discount percentage if old_price > price.
 */
export function calculateDiscountPercent(
  currentPrice: string,
  oldPrice: string | null | undefined
): number | null {
  const current = parseBrlPrice(currentPrice);
  const old = parseBrlPrice(oldPrice);
  if (!current || !old || old <= current) return null;
  const percent = Math.round(((old - current) / old) * 100);
  return percent >= 1 && percent <= 99 ? percent : null;
}

/**
 * Formats a clean WhatsApp share link containing the product title, price, and affiliate URL.
 */
export function buildWhatsAppShareUrl(title: string, price: string, affiliateUrl: string): string {
  const safeUrl = sanitizeHttpUrl(affiliateUrl) ?? '';
  const text = `Olha esse achadinho no Baratinhos da Internet!\n\n${title}\nPor apenas ${price}\n\nConfira no Mercado Livre: ${safeUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Determines whether a badge should use Flame Orange (#F26522) or Gold Yellow (#F6C84C).
 */
export function isHotBadge(badge: string | null | undefined): boolean {
  if (!badge) return false;
  const normalized = badge.toLowerCase();
  return (
    normalized.includes('quente') ||
    normalized.includes('relâmpago') ||
    normalized.includes('relampago') ||
    normalized.includes('promo') ||
    normalized.includes('desconto')
  );
}

/**
 * Extracts the object path inside the public Supabase Storage bucket `vitrine-images`
 * from a full public URL, returning null if the URL is external.
 */
export function extractStorageObjectPath(imageUrl: string): string | null {
  const safeUrl = sanitizeHttpUrl(imageUrl);
  if (!safeUrl) return null;

  const marker = `/storage/v1/object/public/${STORAGE_BUCKET_NAME}/`;
  const idx = safeUrl.indexOf(marker);
  if (idx === -1) return null;

  const rawPath = safeUrl.slice(idx + marker.length).split('?')[0];
  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

/**
 * Validates whether a File is an accepted image format and within the 5MB limit.
 */
export function validateImageFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return 'Formato inválido. Envie uma imagem JPG, PNG, WebP ou GIF.';
  }
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return 'A imagem ultrapassa o limite de 5 MB. Escolha um arquivo menor.';
  }
  return null;
}
