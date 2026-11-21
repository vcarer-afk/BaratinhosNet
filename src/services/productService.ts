import { supabase } from '../lib/supabase';
import { STORAGE_BUCKET_NAME, type Product, type ProductInput } from '../types/product';
import { extractStorageObjectPath, sanitizeHttpUrl, validateImageFile } from '../utils/formatters';

function assertSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase não configurado. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
    );
  }
  return supabase;
}

function getExtensionFromMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

function generateSafeFileName(mimeType: string): string {
  const ext = getExtensionFromMime(mimeType);
  const uniquePart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `products/${Date.now()}-${uniquePart}.${ext}`;
}

export async function fetchPublicProducts(): Promise<Product[]> {
  const client = assertSupabase();
  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Erro ao carregar os achadinhos.');
  }
  return (data ?? []) as Product[];
}

export async function fetchAllProducts(): Promise<Product[]> {
  const client = assertSupabase();
  const { data, error } = await client
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Erro ao carregar a lista de produtos.');
  }
  return (data ?? []) as Product[];
}

export async function uploadProductImage(file: File): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const client = assertSupabase();
  const filePath = generateSafeFileName(file.type);

  const { error: uploadError } = await client.storage
    .from(STORAGE_BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      uploadError.message ||
        `Falha ao enviar imagem para o bucket "${STORAGE_BUCKET_NAME}".`
    );
  }

  const { data } = client.storage.from(STORAGE_BUCKET_NAME).getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error('Não foi possível obter a URL pública da imagem enviada.');
  }
  return data.publicUrl;
}

export async function deleteStorageImageByUrl(imageUrl: string): Promise<void> {
  const objectPath = extractStorageObjectPath(imageUrl);
  if (!objectPath) return;

  const client = assertSupabase();
  const { error } = await client.storage.from(STORAGE_BUCKET_NAME).remove([objectPath]);
  if (error) {
    throw new Error(error.message || 'Erro ao remover a imagem do Storage.');
  }
}

function validateAndCleanInput(input: ProductInput): ProductInput {
  const title = input.title.trim();
  const description = input.description.trim();
  const category = input.category.trim();
  const price = input.price.trim();
  const oldPrice = input.old_price?.trim() || null;
  const badge = input.badge?.trim() || null;
  const imageUrl = sanitizeHttpUrl(input.image_url);
  const affiliateUrl = sanitizeHttpUrl(input.affiliate_url);

  if (!title) throw new Error('Informe o título do produto.');
  if (!category) throw new Error('Selecione uma categoria.');
  if (!price) throw new Error('Informe o preço atual do produto.');
  if (!imageUrl) {
    throw new Error('Envie uma imagem ou informe uma URL de imagem válida (https://).');
  }
  if (!affiliateUrl) {
    throw new Error('Informe um link oficial de afiliado válido (https://).');
  }

  return {
    title,
    description,
    category,
    price,
    old_price: oldPrice,
    badge,
    image_url: imageUrl,
    affiliate_url: affiliateUrl,
    is_active: Boolean(input.is_active),
    is_featured: Boolean(input.is_featured),
  };
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const client = assertSupabase();
  const payload = validateAndCleanInput(input);

  const { data, error } = await client
    .from('products')
    .insert([payload])
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Não foi possível salvar o produto.');
  }
  return data as Product;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const client = assertSupabase();
  const payload = validateAndCleanInput(input);

  const { data, error } = await client
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Não foi possível atualizar o produto.');
  }
  return data as Product;
}

export async function toggleProductActive(id: string, nextActive: boolean): Promise<Product> {
  const client = assertSupabase();
  const { data, error } = await client
    .from('products')
    .update({ is_active: nextActive })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Não foi possível alterar o status da oferta.');
  }
  return data as Product;
}

export async function deleteProduct(
  product: Product,
  removeImageFromStorage: boolean
): Promise<void> {
  const client = assertSupabase();

  const { error } = await client.from('products').delete().eq('id', product.id);
  if (error) {
    throw new Error(error.message || 'Não foi possível excluir o produto.');
  }

  if (removeImageFromStorage && product.image_url) {
    try {
      await deleteStorageImageByUrl(product.image_url);
    } catch {
      // Product row is already removed; ignore non-fatal storage cleanup error
    }
  }
}
