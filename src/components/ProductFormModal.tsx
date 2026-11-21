import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import {
  BADGE_PRESETS,
  PRODUCT_CATEGORIES,
  STORAGE_BUCKET_NAME,
  type Product,
  type ProductInput,
} from '../types/product';
import { uploadProductImage } from '../services/productService';
import { sanitizeHttpUrl } from '../utils/formatters';

interface ProductFormModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  onClose: () => void;
  onSave: (input: ProductInput, editingId?: string) => Promise<void>;
}

type ImageSourceTab = 'upload' | 'url';

export function ProductFormModal({
  isOpen,
  editingProduct,
  onClose,
  onSave,
}: ProductFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(PRODUCT_CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [badge, setBadge] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [imageTab, setImageTab] = useState<ImageSourceTab>('upload');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (editingProduct) {
      setTitle(editingProduct.title);
      setDescription(editingProduct.description ?? '');
      setCategory(editingProduct.category || PRODUCT_CATEGORIES[0]);
      setPrice(editingProduct.price);
      setOldPrice(editingProduct.old_price ?? '');
      setBadge(editingProduct.badge ?? '');
      setImageUrl(editingProduct.image_url);
      setAffiliateUrl(editingProduct.affiliate_url);
      setIsActive(editingProduct.is_active);
      setIsFeatured(editingProduct.is_featured);
      setImageTab(
        editingProduct.image_url.includes(`/storage/v1/object/public/${STORAGE_BUCKET_NAME}/`)
          ? 'upload'
          : 'url'
      );
    } else {
      setTitle('');
      setDescription('');
      setCategory(PRODUCT_CATEGORIES[0]);
      setPrice('');
      setOldPrice('');
      setBadge('');
      setImageUrl('');
      setAffiliateUrl('');
      setIsActive(true);
      setIsFeatured(false);
      setImageTab('upload');
    }

    setError(null);
    setUploadSuccess(false);
    setPreviewError(false);
  }, [isOpen, editingProduct]);

  if (!isOpen) return null;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadSuccess(false);
    setError(null);

    try {
      const publicUrl = await uploadProductImage(file);
      setImageUrl(publicUrl);
      setPreviewError(false);
      setUploadSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível enviar a imagem para o Supabase Storage.'
      );
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const safeImage = sanitizeHttpUrl(imageUrl);
    if (!safeImage) {
      setError('Envie uma imagem ou informe uma URL externa válida começando com https://.');
      return;
    }

    const safeAffiliate = sanitizeHttpUrl(affiliateUrl);
    if (!safeAffiliate) {
      setError('Informe um link oficial de afiliado do Mercado Livre válido (https://).');
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          price: price.trim(),
          old_price: oldPrice.trim() || null,
          badge: badge.trim() || null,
          image_url: safeImage,
          affiliate_url: safeAffiliate,
          is_active: isActive,
          is_featured: isFeatured,
        },
        editingProduct?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o produto.');
    } finally {
      setSaving(false);
    }
  };

  const safePreviewUrl = sanitizeHttpUrl(imageUrl);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/55 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving && !uploadingImage) onClose();
      }}
    >
      <div className="w-full sm:max-w-2xl max-h-[92vh] bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2
              id="product-form-title"
              className="text-lg sm:text-xl font-extrabold text-[#1E4E8C] leading-tight"
            >
              {editingProduct ? 'Editar Produto' : 'Adicionar Novo Achadinho'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Os dados são salvos diretamente na nuvem via Supabase.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploadingImage}
            aria-label="Fechar formulário"
            className="min-w-[40px] min-h-[40px] -mr-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 inline-flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="prod-title" className="block text-xs font-bold text-slate-700 mb-1.5">
              Título do Produto *
            </label>
            <input
              id="prod-title"
              type="text"
              required
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Mini Processador de Alimentos Portátil USB 250ml"
              className="w-full h-11 px-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#379BD7] focus:ring-2 focus:ring-[#379BD7]/20 focus:outline-none"
            />
          </div>

          {/* Description (used in storefront search) */}
          <div>
            <label htmlFor="prod-desc" className="block text-xs font-bold text-slate-700 mb-1.5">
              Descrição / Palavras-chave para busca (opcional)
            </label>
            <textarea
              id="prod-desc"
              rows={2}
              maxLength={320}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes úteis ou termos que ajudam os visitantes a encontrar o produto na busca..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#379BD7] focus:ring-2 focus:ring-[#379BD7]/20 focus:outline-none resize-none"
            />
          </div>

          {/* Category + Prices */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label
                htmlFor="prod-category"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Categoria *
              </label>
              <select
                id="prod-category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-[#379BD7] focus:ring-2 focus:ring-[#379BD7]/20 focus:outline-none"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prod-price" className="block text-xs font-bold text-slate-700 mb-1.5">
                Preço Atual *
              </label>
              <input
                id="prod-price"
                type="text"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="R$ 49,90"
                className="w-full h-11 px-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-sm font-semibold text-[#1E4E8C] tabular-nums placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:border-[#379BD7] focus:ring-2 focus:ring-[#379BD7]/20 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="prod-old-price"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Preço Antigo (opcional)
              </label>
              <input
                id="prod-old-price"
                type="text"
                value={oldPrice}
                onChange={(e) => setOldPrice(e.target.value)}
                placeholder="R$ 79,90"
                className="w-full h-11 px-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-sm text-slate-700 tabular-nums placeholder:text-slate-400 focus:bg-white focus:border-[#379BD7] focus:ring-2 focus:ring-[#379BD7]/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Optional Badge / Tag */}
          <div>
            <label htmlFor="prod-badge" className="block text-xs font-bold text-slate-700 mb-1.5">
              Selo / Etiqueta opcional
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setBadge('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  badge === ''
                    ? 'bg-[#1E4E8C] text-white border-[#1E4E8C]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#379BD7]'
                }`}
              >
                Sem selo
              </button>
              {BADGE_PRESETS.map((preset) => {
                const active = badge === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBadge(preset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      active
                        ? preset === 'Oferta Quente'
                          ? 'bg-[#F26522] text-white border-[#F26522]'
                          : 'bg-[#F6C84C] text-[#1E4E8C] border-[#F6C84C]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#379BD7]'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
            <input
              id="prod-badge"
              type="text"
              maxLength={28}
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="Ou digite um selo personalizado (ex: Cupom Ativo)"
              className="w-full h-10 px-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#379BD7] focus:ring-2 focus:ring-[#379BD7]/20 focus:outline-none"
            />
          </div>

          {/* Product Image: Direct Upload to vitrine-images OR External URL */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">Imagem do Produto *</span>
              <div className="inline-flex p-1 bg-slate-200/70 rounded-lg self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    imageTab === 'upload'
                      ? 'bg-white text-[#1E4E8C] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Upload Direto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    imageTab === 'url'
                      ? 'bg-white text-[#1E4E8C] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>URL Externa</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Square Live Preview */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                {safePreviewUrl && !previewError ? (
                  <img
                    src={safePreviewUrl}
                    alt="Prévia da imagem do produto"
                    referrerPolicy="no-referrer"
                    onError={() => setPreviewError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 p-2 text-center">
                    <ImageIcon className="w-6 h-6 mb-1" aria-hidden="true" />
                    <span className="text-[11px]">Prévia 1:1</span>
                  </div>
                )}
              </div>

              {/* Upload or URL Input */}
              <div className="flex-1 w-full space-y-2">
                {imageTab === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileChange}
                      className="hidden"
                      id="prod-image-file"
                    />
                    <label
                      htmlFor="prod-image-file"
                      className={`w-full min-h-[44px] px-4 py-3 rounded-xl border-2 border-dashed border-[#379BD7]/50 hover:border-[#1E4E8C] bg-white cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-[#1E4E8C] transition-colors ${
                        uploadingImage ? 'opacity-60 pointer-events-none' : ''
                      }`}
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#379BD7]" />
                          <span>Enviando para o bucket {STORAGE_BUCKET_NAME}...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-[#379BD7]" />
                          <span>
                            {imageUrl ? 'Trocar imagem enviada' : 'Escolher imagem do dispositivo'}
                          </span>
                        </>
                      )}
                    </label>
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      JPG, PNG, WebP ou GIF (máx. 5 MB) • Bucket público{' '}
                      <code className="font-mono text-[#1E4E8C]">{STORAGE_BUCKET_NAME}</code>
                    </p>
                    {uploadSuccess && (
                      <p className="mt-1 text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Imagem enviada com sucesso!</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label htmlFor="prod-image-url" className="sr-only">
                      URL externa da imagem
                    </label>
                    <input
                      id="prod-image-url"
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setPreviewError(false);
                        setUploadSuccess(false);
                      }}
                      placeholder="https://http2.mlstatic.com/..."
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#379BD7] focus:ring-2 focus:ring-[#379BD7]/20 focus:outline-none"
                    />
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Cole o endereço completo (https://) de uma imagem pública do produto.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Official Affiliate Link */}
          <div>
            <label
              htmlFor="prod-affiliate-url"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Link Oficial de Afiliado do Mercado Livre *
            </label>
            <input
              id="prod-affiliate-url"
              type="url"
              required
              value={affiliateUrl}
              onChange={(e) => setAffiliateUrl(e.target.value)}
              placeholder="https://mercadolivre.com/sec/..."
              className="w-full h-11 px-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#379BD7] focus:ring-2 focus:ring-[#379BD7]/20 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              O botão &ldquo;Ver no Mercado Livre&rdquo; apontará diretamente para este endereço.
            </p>
          </div>

          {/* Toggles: Active & Featured */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-[#379BD7]/60 transition-colors">
              <div>
                <p className="text-sm font-bold text-slate-900">Produto Ativo</p>
                <p className="text-xs text-slate-500">Exibir oferta na vitrine pública</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#379BD7] ${
                  isActive ? 'bg-[#1E4E8C]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-[#379BD7]/60 transition-colors">
              <div>
                <p className="text-sm font-bold text-slate-900">Destaque</p>
                <p className="text-xs text-slate-500">Priorizar no topo da grade</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isFeatured}
                onClick={() => setIsFeatured((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#379BD7] ${
                  isFeatured ? 'bg-[#F26522]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${
                    isFeatured ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || uploadingImage}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#F26522] hover:bg-[#D95314] disabled:opacity-60 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E4E8C]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{editingProduct ? 'Salvar Alterações' : 'Publicar Achadinho'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
