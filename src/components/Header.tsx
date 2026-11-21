import { Lock, LockOpen, Search, X } from 'lucide-react';
import {
  BRAND_LOGO_URL,
  STOREFRONT_CATEGORIES,
  type StorefrontCategory,
} from '../types/product';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: StorefrontCategory;
  onSelectCategory: (category: StorefrontCategory) => void;
  isAuthenticated: boolean;
  onOpenAdmin: () => void;
  onLogoClick: () => void;
}

export function Header({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  isAuthenticated,
  onOpenAdmin,
  onLogoClick,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200/80">
      <div className="h-1 w-full bg-[#1E4E8C]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        {/* Top Row: Brand Identity + Desktop Search + Discreet Admin Lock */}
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          <button
            type="button"
            onClick={onLogoClick}
            className="flex items-center gap-3 text-left group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#379BD7] rounded-xl min-w-0"
          >
            <img
              src={BRAND_LOGO_URL}
              alt="Logo Baratinhos da Internet"
              referrerPolicy="no-referrer"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shrink-0 ring-2 ring-[#F6C84C]/80 shadow-xs transition-transform duration-200 group-hover:scale-[1.03]"
            />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-extrabold text-[#1E4E8C] leading-tight tracking-tight truncate">
                Baratinhos da Internet
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[#379BD7] leading-snug truncate">
                Achadinhos do Mercado Livre
              </p>
            </div>
          </button>

          {/* Desktop Search Bar */}
          <div className="hidden md:block flex-1 max-w-md lg:max-w-lg">
            <label htmlFor="desktop-search" className="sr-only">
              Buscar produtos por título ou descrição
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="desktop-search"
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar achadinhos por nome ou descrição..."
                className="w-full h-11 pl-10 pr-10 rounded-full bg-[#F8FAFC] border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#379BD7] focus:ring-2 focus:ring-[#379BD7]/20 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Limpar busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Discreet Admin Padlock Button */}
          <button
            type="button"
            onClick={onOpenAdmin}
            title={isAuthenticated ? 'Abrir Painel Administrativo' : 'Acesso Administrativo'}
            aria-label={isAuthenticated ? 'Abrir Painel Administrativo' : 'Acesso Administrativo'}
            className={`shrink-0 min-w-[44px] min-h-[44px] rounded-full inline-flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#379BD7] ${
              isAuthenticated
                ? 'bg-[#1E4E8C]/10 text-[#1E4E8C] hover:bg-[#1E4E8C]/15'
                : 'text-slate-400 hover:text-[#1E4E8C] hover:bg-slate-100'
            }`}
          >
            {isAuthenticated ? (
              <LockOpen className="w-5 h-5" />
            ) : (
              <Lock className="w-[18px] h-[18px]" />
            )}
          </button>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 md:hidden">
          <label htmlFor="mobile-search" className="sr-only">
            Buscar produtos por título ou descrição
          </label>
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="mobile-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar achadinhos..."
              className="w-full h-11 pl-10 pr-10 rounded-full bg-[#F8FAFC] border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#379BD7] focus:ring-2 focus:ring-[#379BD7]/20 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Scrollable Pill Categories */}
        <nav
          aria-label="Categorias de produtos"
          className="mt-3.5 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar"
        >
          <div className="flex items-center gap-2 pb-1">
            {STOREFRONT_CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onSelectCategory(category)}
                  aria-pressed={isSelected}
                  className={`whitespace-nowrap shrink-0 min-h-[40px] px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#379BD7] ${
                    isSelected
                      ? 'bg-[#1E4E8C] text-white shadow-xs'
                      : 'bg-[#F8FAFC] text-slate-700 border border-slate-200 hover:border-[#379BD7] hover:text-[#1E4E8C]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
