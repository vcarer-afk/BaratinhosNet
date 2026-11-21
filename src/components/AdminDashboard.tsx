import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  LogOut,
  Package,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Star,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { BRAND_LOGO_URL, type Product, type ProductInput } from '../types/product';
import { extractStorageObjectPath, sanitizeHttpUrl } from '../utils/formatters';
import { ProductFormModal } from './ProductFormModal';

interface AdminDashboardProps {
  userEmail: string;
  products: Product[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onCreate: (input: ProductInput) => Promise<void>;
  onUpdate: (id: string, input: ProductInput) => Promise<void>;
  onToggleActive: (product: Product) => Promise<void>;
  onDelete: (product: Product, removeStorageImage: boolean) => Promise<void>;
  onBackToStorefront: () => void;
  onSignOut: () => Promise<void>;
}

type StatusFilter = 'all' | 'active' | 'paused';

export function AdminDashboard({
  userEmail,
  products,
  loading,
  error,
  onRefresh,
  onCreate,
  onUpdate,
  onToggleActive,
  onDelete,
  onBackToStorefront,
  onSignOut,
}: AdminDashboardProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [removeStorageImage, setRemoveStorageImage] = useState(true);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.is_active).length;
    const featured = products.filter((p) => p.is_featured).length;
    return { total, active, paused: total - active, featured };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((item) => {
      if (statusFilter === 'active' && !item.is_active) return false;
      if (statusFilter === 'paused' && item.is_active) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description ?? '').toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [products, search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleSaveForm = async (input: ProductInput, editingId?: string) => {
    if (editingId) {
      await onUpdate(editingId, input);
    } else {
      await onCreate(input);
    }
  };

  const handleQuickToggle = async (product: Product) => {
    setTogglingId(product.id);
    try {
      await onToggleActive(product);
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenDelete = (product: Product) => {
    setDeletingProduct(product);
    setRemoveStorageImage(Boolean(extractStorageObjectPath(product.image_url)));
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setDeletingBusy(true);
    try {
      await onDelete(deletingProduct, removeStorageImage);
      setDeletingProduct(null);
    } finally {
      setDeletingBusy(false);
    }
  };

  const handleSignOutClick = async () => {
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Admin Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="h-1 bg-[#1E4E8C]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={BRAND_LOGO_URL}
              alt="Baratinhos da Internet"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#F6C84C]/80 shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-[#1E4E8C] leading-tight truncate">
                Painel Administrativo
              </h1>
              <p className="text-xs text-slate-500 truncate">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onBackToStorefront}
              className="min-h-[40px] px-3 sm:px-3.5 py-2 rounded-lg border border-slate-200 hover:border-[#379BD7] text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#1E4E8C] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Store className="w-4 h-4 text-[#379BD7]" aria-hidden="true" />
              <span className="hidden sm:inline">Ver Vitrine</span>
              <span className="sm:hidden">Vitrine</span>
            </button>

            <button
              type="button"
              onClick={handleSignOutClick}
              disabled={signingOut}
              className="min-h-[40px] px-3 sm:px-3.5 py-2 rounded-lg bg-[#1E4E8C] hover:bg-[#173d6e] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              {signingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="w-4 h-4" aria-hidden="true" />
              )}
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Metrics Summary */}
        <section
          aria-label="Resumo do catálogo"
          className="grid grid-cols-3 gap-3 sm:gap-4"
        >
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">Cadastrados</p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#1E4E8C] tabular-nums">
              {stats.total}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">Ativos na Vitrine</p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums">
              {stats.active}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">Em Destaque</p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#F26522] tabular-nums">
              {stats.featured}
            </p>
          </div>
        </section>

        {/* Action & Search Toolbar */}
        <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produto cadastrado..."
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#F8FAFC] border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#379BD7] focus:ring-2 focus:ring-[#379BD7]/20 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Limpar busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                title="Atualizar lista do Supabase"
                aria-label="Atualizar lista do Supabase"
                className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 hover:border-[#379BD7] text-slate-600 hover:text-[#1E4E8C] inline-flex items-center justify-center transition-colors shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F26522] hover:bg-[#D95314] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Novo Produto</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            {(
              [
                { key: 'all', label: `Todos (${stats.total})` },
                { key: 'active', label: `Ativos (${stats.active})` },
                { key: 'paused', label: `Pausados (${stats.paused})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold tabular-nums transition-colors whitespace-nowrap ${
                  statusFilter === tab.key
                    ? 'bg-white text-[#1E4E8C] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold">Erro ao comunicar com o Supabase</p>
              <p className="text-xs mt-1 text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Product List */}
        {loading && products.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 animate-pulse"
              >
                <div className="w-16 h-16 rounded-lg bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <Package className="w-10 h-10 text-[#379BD7]/60 mx-auto mb-3" aria-hidden="true" />
            <h2 className="text-base font-bold text-[#1E4E8C]">
              {products.length === 0
                ? 'Nenhum achadinho cadastrado ainda'
                : 'Nenhum produto encontrado com esses filtros'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {products.length === 0
                ? 'Clique em "Novo Produto" para publicar sua primeira oferta do Mercado Livre na vitrine.'
                : 'Tente limpar a busca ou trocar o filtro de status.'}
            </p>
            {products.length === 0 && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F26522] hover:bg-[#D95314] text-white text-sm font-bold inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Primeiro Produto</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => {
              const safeImage = sanitizeHttpUrl(product.image_url);
              const safeLink = sanitizeHttpUrl(product.affiliate_url);
              const isToggling = togglingId === product.id;

              return (
                <article
                  key={product.id}
                  className={`bg-white rounded-xl border p-3.5 sm:p-4 transition-colors ${
                    product.is_active
                      ? 'border-slate-200'
                      : 'border-slate-200/80 bg-slate-50/70'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Left: Thumbnail + Core Metadata */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0">
                        {safeImage ? (
                          <img
                            src={safeImage}
                            alt={product.title}
                            referrerPolicy="no-referrer"
                            className={`w-full h-full object-cover ${
                              product.is_active ? '' : 'opacity-60 grayscale-[40%]'
                            }`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                          <span className="font-semibold text-[#379BD7]">{product.category}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              product.is_active ? 'text-emerald-700' : 'text-slate-500'
                            }`}
                          >
                            {product.is_active ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Ativo</span>
                              </>
                            ) : (
                              <>
                                <PauseCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Pausado</span>
                              </>
                            )}
                          </span>
                          {product.is_featured && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                                <Star
                                  className="w-3.5 h-3.5 fill-[#F6C84C] text-[#F6C84C]"
                                  aria-hidden="true"
                                />
                                <span>Destaque</span>
                              </span>
                            </>
                          )}
                          {product.badge && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-[#F26522]">{product.badge}</span>
                            </>
                          )}
                        </div>

                        <h3 className="mt-1 text-sm sm:text-base font-bold text-slate-900 line-clamp-2">
                          {product.title}
                        </h3>

                        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                          <span className="text-base font-extrabold text-[#1E4E8C] tabular-nums">
                            {product.price}
                          </span>
                          {product.old_price && (
                            <span className="text-xs text-slate-400 line-through tabular-nums">
                              {product.old_price}
                            </span>
                          )}
                          {safeLink && (
                            <a
                              href={safeLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-[#379BD7] hover:text-[#1E4E8C] inline-flex items-center gap-1 ml-1"
                            >
                              <span>Testar link</span>
                              <ExternalLink className="w-3 h-3" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Action Controls */}
                    <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuickToggle(product)}
                        disabled={isToggling}
                        className={`flex-1 md:flex-initial min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold border inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                          product.is_active
                            ? 'border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        ) : product.is_active ? (
                          <PauseCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>{product.is_active ? 'Pausar' : 'Ativar'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(product)}
                        className="flex-1 md:flex-initial min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 hover:border-[#379BD7] text-xs font-semibold text-slate-700 hover:text-[#1E4E8C] inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDelete(product)}
                        aria-label={`Excluir ${product.title}`}
                        className="min-w-[40px] min-h-[40px] px-2.5 py-2 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-500 hover:text-red-700 inline-flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Add / Edit Modal */}
      <ProductFormModal
        isOpen={formOpen}
        editingProduct={editingProduct}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveForm}
      />

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingBusy) setDeletingProduct(null);
          }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4">
            <h2 id="delete-modal-title" className="text-lg font-extrabold text-slate-900">
              Excluir produto?
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Você está prestes a remover{' '}
              <strong className="text-slate-900">{deletingProduct.title}</strong> do catálogo no
              Supabase. Esta ação não pode ser desfeita.
            </p>

            {extractStorageObjectPath(deletingProduct.image_url) && (
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removeStorageImage}
                  onChange={(e) => setRemoveStorageImage(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#1E4E8C] focus:ring-[#379BD7]"
                />
                <span className="text-xs text-slate-700 leading-snug">
                  Remover também o arquivo de imagem armazenado no Supabase Storage
                </span>
              </label>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={deletingBusy}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingBusy}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold inline-flex items-center gap-2 transition-colors"
              >
                {deletingBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
