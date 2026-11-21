import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  AlertCircle,
  CheckCircle2,
  PackageSearch,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import {
  createProduct,
  deleteProduct,
  fetchAllProducts,
  fetchPublicProducts,
  toggleProductActive,
  updateProduct,
} from './services/productService';
import type { Product, ProductInput, StorefrontCategory } from './types/product';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { Footer } from './components/Footer';
import { SupabaseSetupNotice } from './components/SupabaseSetupNotice';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';

interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'error';
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [viewMode, setViewMode] = useState<'storefront' | 'admin'>('storefront');
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Storefront state
  const [publicProducts, setPublicProducts] = useState<Product[]>([]);
  const [publicLoading, setPublicLoading] = useState(isSupabaseConfigured);
  const [publicError, setPublicError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StorefrontCategory>('Todos');

  // Admin state
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, tone: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToast({ id, text, tone });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3500);
  }, []);

  const loadPublicProducts = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setPublicLoading(false);
      return;
    }
    setPublicLoading(true);
    setPublicError(null);
    try {
      const items = await fetchPublicProducts();
      setPublicProducts(items);
    } catch (err) {
      setPublicError(
        err instanceof Error ? err.message : 'Não foi possível carregar os achadinhos.'
      );
    } finally {
      setPublicLoading(false);
    }
  }, []);

  const loadAdminProducts = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setAdminLoading(true);
    setAdminError(null);
    try {
      const items = await fetchAllProducts();
      setAdminProducts(items);
    } catch (err) {
      setAdminError(
        err instanceof Error ? err.message : 'Não foi possível carregar os produtos cadastrados.'
      );
    } finally {
      setAdminLoading(false);
    }
  }, []);

  // Listen to Supabase Auth state in memory (zero localStorage / sessionStorage)
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setViewMode('storefront');
        setAdminProducts([]);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Initial load of public storefront
  useEffect(() => {
    void loadPublicProducts();
  }, [loadPublicProducts]);

  // Load admin catalog whenever admin dashboard opens while authenticated
  useEffect(() => {
    if (session && viewMode === 'admin') {
      void loadAdminProducts();
    }
  }, [session, viewMode, loadAdminProducts]);

  const filteredPublicProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publicProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === 'Todos' || product.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        product.title.toLowerCase().includes(q) ||
        (product.description ?? '').toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q)
      );
    });
  }, [publicProducts, searchQuery, selectedCategory]);

  const handleOpenAdmin = () => {
    if (session) {
      setViewMode('admin');
    } else {
      setLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    setLoginModalOpen(false);
    setViewMode('admin');
    showToast('Login realizado com sucesso.');
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setViewMode('storefront');
    showToast('Sessão encerrada com segurança.');
    void loadPublicProducts();
  };

  const handleCreateProduct = async (input: ProductInput) => {
    const created = await createProduct(input);
    setAdminProducts((prev) => [created, ...prev]);
    void loadPublicProducts();
    showToast('Achadinho publicado com sucesso.');
  };

  const handleUpdateProduct = async (id: string, input: ProductInput) => {
    const updated = await updateProduct(id, input);
    setAdminProducts((prev) => prev.map((item) => (item.id === id ? updated : item)));
    void loadPublicProducts();
    showToast('Produto atualizado com sucesso.');
  };

  const handleToggleActive = async (product: Product) => {
    const nextActive = !product.is_active;
    try {
      const updated = await toggleProductActive(product.id, nextActive);
      setAdminProducts((prev) =>
        prev.map((item) => (item.id === product.id ? updated : item))
      );
      void loadPublicProducts();
      showToast(nextActive ? 'Oferta ativada na vitrine.' : 'Oferta pausada.');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao atualizar status da oferta.',
        'error'
      );
    }
  };

  const handleDeleteProduct = async (product: Product, removeStorageImage: boolean) => {
    try {
      await deleteProduct(product, removeStorageImage);
      setAdminProducts((prev) => prev.filter((item) => item.id !== product.id));
      void loadPublicProducts();
      showToast('Produto excluído com sucesso.');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao excluir o produto.',
        'error'
      );
      throw err;
    }
  };

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedCategory !== 'Todos';

  // Render Cloud Admin Panel when authenticated and selected
  if (session && viewMode === 'admin') {
    return (
      <>
        <AdminDashboard
          userEmail={session.user.email ?? 'Administrador'}
          products={adminProducts}
          loading={adminLoading}
          error={adminError}
          onRefresh={loadAdminProducts}
          onCreate={handleCreateProduct}
          onUpdate={handleUpdateProduct}
          onToggleActive={handleToggleActive}
          onDelete={handleDeleteProduct}
          onBackToStorefront={() => {
            setViewMode('storefront');
            void loadPublicProducts();
          }}
          onSignOut={handleSignOut}
        />

        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 ${
              toast.tone === 'error'
                ? 'bg-red-600 text-white border-red-700'
                : 'bg-[#1E4E8C] text-white border-[#173d6e]'
            }`}
          >
            {toast.tone === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#F6C84C]" />
            )}
            <span>{toast.text}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        isAuthenticated={Boolean(session)}
        onOpenAdmin={handleOpenAdmin}
        onLogoClick={() => {
          setSelectedCategory('Todos');
          setSearchQuery('');
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!isSupabaseConfigured ? (
          <SupabaseSetupNotice />
        ) : (
          <>
            {/* Results Context Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#1E4E8C] tracking-tight">
                  {selectedCategory === 'Todos' ? 'Achadinhos em Destaque' : selectedCategory}
                </h2>
                {!publicLoading && !publicError && (
                  <span className="text-xs sm:text-sm font-medium text-slate-500 tabular-nums">
                    · {filteredPublicProducts.length}{' '}
                    {filteredPublicProducts.length === 1 ? 'oferta' : 'ofertas'}
                  </span>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('Todos');
                  }}
                  className="text-xs sm:text-sm font-semibold text-[#379BD7] hover:text-[#1E4E8C] underline underline-offset-4 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {/* Loading State */}
            {publicLoading ? (
              <div
                aria-label="Carregando ofertas"
                className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5"
              >
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-slate-200/80 overflow-hidden animate-pulse"
                  >
                    <div className="aspect-square bg-slate-200/70" />
                    <div className="p-3 sm:p-4 space-y-2.5">
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-4 bg-slate-200 rounded w-full" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="pt-2 h-6 bg-slate-200 rounded w-1/2" />
                      <div className="h-10 bg-slate-200 rounded-lg w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : publicError ? (
              /* Error State */
              <div
                role="alert"
                className="max-w-lg mx-auto my-10 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs"
              >
                <AlertCircle className="w-10 h-10 text-[#F26522] mx-auto mb-3" aria-hidden="true" />
                <h3 className="text-lg font-extrabold text-[#1E4E8C]">
                  Não foi possível carregar a vitrine
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{publicError}</p>
                <button
                  type="button"
                  onClick={() => void loadPublicProducts()}
                  className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1E4E8C] hover:bg-[#173d6e] text-white text-sm font-bold inline-flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  <span>Tentar novamente</span>
                </button>
              </div>
            ) : filteredPublicProducts.length === 0 ? (
              /* Empty State */
              <div className="max-w-lg mx-auto my-10 bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center shadow-xs">
                {hasActiveFilters ? (
                  <>
                    <PackageSearch
                      className="w-11 h-11 text-[#379BD7] mx-auto mb-3"
                      aria-hidden="true"
                    />
                    <h3 className="text-lg font-extrabold text-[#1E4E8C]">
                      Nenhum achadinho encontrado
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Não encontramos produtos para sua busca atual. Tente outro termo ou explore
                      todas as categorias.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('Todos');
                      }}
                      className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1E4E8C] hover:bg-[#173d6e] text-white text-sm font-bold transition-colors"
                    >
                      Ver todas as ofertas
                    </button>
                  </>
                ) : (
                  <>
                    <ShoppingBag
                      className="w-11 h-11 text-[#379BD7] mx-auto mb-3"
                      aria-hidden="true"
                    />
                    <h3 className="text-lg font-extrabold text-[#1E4E8C]">
                      Vitrine pronta para receber ofertas
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Ainda não há produtos ativos publicados no catálogo. Acesse o ícone de cadeado
                      no topo para entrar no painel administrativo e cadastrar seus achadinhos.
                    </p>
                  </>
                )}
              </div>
            ) : (
              /* Responsive Product Grid: 2 cols mobile, 3 cols tablet, 4 cols desktop */
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {filteredPublicProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 ${
            toast.tone === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-[#1E4E8C] text-white border-[#173d6e]'
          }`}
        >
          {toast.tone === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#F6C84C]" />
          )}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}
