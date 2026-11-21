import { useState } from 'react';
import { ExternalLink, Flame, Package, Star } from 'lucide-react';
import type { Product } from '../types/product';
import {
  buildWhatsAppShareUrl,
  calculateDiscountPercent,
  isHotBadge,
  sanitizeHttpUrl,
} from '../utils/formatters';

interface ProductCardProps {
  product: Product;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const safeImageUrl = sanitizeHttpUrl(product.image_url);
  const safeAffiliateUrl = sanitizeHttpUrl(product.affiliate_url) ?? '#';
  const whatsappUrl = buildWhatsAppShareUrl(
    product.title,
    product.price,
    safeAffiliateUrl
  );
  const discountPercent = calculateDiscountPercent(product.price, product.old_price);
  const hotBadge = isHotBadge(product.badge);

  return (
    <article className="group bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-md hover:border-[#379BD7]/50 hover:-translate-y-0.5 transition-[transform,box-shadow,border-color] duration-200 flex flex-col overflow-hidden">
      {/* Square Product Photo */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden border-b border-slate-100">
        {safeImageUrl && !imageError ? (
          <img
            src={safeImageUrl}
            alt={product.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-slate-50 to-sky-50/70">
            <Package className="w-9 h-9 text-[#379BD7]/60 mb-2" aria-hidden="true" />
            <span className="text-xs font-medium text-slate-400 line-clamp-2">
              {product.title}
            </span>
          </div>
        )}

        {/* Optional Top-Left Badge */}
        {product.badge && (
          <span
            className={`absolute top-2 left-2 sm:top-2.5 sm:left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold shadow-xs leading-none ${
              hotBadge
                ? 'bg-[#F26522] text-white'
                : 'bg-[#F6C84C] text-[#1E4E8C]'
            }`}
          >
            {hotBadge && <Flame className="w-3 h-3 shrink-0" aria-hidden="true" />}
            <span>{product.badge}</span>
          </span>
        )}

        {/* Featured Indicator */}
        {product.is_featured && (
          <span
            title="Achadinho em Destaque"
            aria-label="Achadinho em Destaque"
            className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-7 h-7 rounded-full bg-white/95 text-[#1E4E8C] shadow-xs inline-flex items-center justify-center"
          >
            <Star className="w-3.5 h-3.5 fill-[#F6C84C] text-[#F6C84C]" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* Product Info & CTA */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <p className="text-[11px] sm:text-xs font-semibold text-[#379BD7] truncate mb-1">
          {product.category}
        </p>

        <h2 className="text-xs sm:text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 min-h-[2.25rem] sm:min-h-[2.65rem]">
          {product.title}
        </h2>

        {/* Pricing */}
        <div className="mt-auto pt-2.5 sm:pt-3">
          <div className="min-h-[1.125rem] flex items-center gap-1.5 flex-wrap">
            {product.old_price && (
              <span className="text-[11px] sm:text-xs text-slate-400 line-through tabular-nums">
                {product.old_price}
              </span>
            )}
            {discountPercent !== null && (
              <span className="text-[11px] sm:text-xs font-bold text-[#F26522] tabular-nums">
                -{discountPercent}%
              </span>
            )}
          </div>
          <p className="text-base sm:text-xl font-extrabold text-[#1E4E8C] tabular-nums tracking-tight leading-tight mt-0.5">
            {product.price}
          </p>
        </div>

        {/* Buy CTA (Direct Affiliate <a>) + WhatsApp Share Button */}
        <div className="mt-3 flex items-center gap-1.5 sm:gap-2">
          <a
            href={safeAffiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-h-[42px] px-2.5 sm:px-3 py-2 rounded-lg bg-[#F26522] hover:bg-[#D95314] active:scale-[0.99] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 text-center leading-tight transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E4E8C]"
          >
            <span className="truncate">Ver no Mercado Livre</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0 hidden sm:inline" aria-hidden="true" />
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Compartilhar oferta no WhatsApp"
            aria-label={`Compartilhar ${product.title} no WhatsApp`}
            className="w-[42px] h-[42px] shrink-0 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-emerald-600 inline-flex items-center justify-center transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#379BD7]"
          >
            <WhatsAppIcon className="w-[18px] h-[18px]" />
          </a>
        </div>
      </div>
    </article>
  );
}
