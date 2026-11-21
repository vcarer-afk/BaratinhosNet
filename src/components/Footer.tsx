import { BRAND_LOGO_URL } from '../types/product';

function InstagramIcon({ className }: { className?: string }) {
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
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
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
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1E4E8C] text-white mt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-white/15">
          <div className="flex items-center gap-3.5">
            <img
              src={BRAND_LOGO_URL}
              alt="Logo Baratinhos da Internet"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-[#F6C84C]/80 shrink-0"
            />
            <div>
              <p className="font-display text-lg font-extrabold tracking-tight text-white">
                Baratinhos da Internet
              </p>
              <p className="text-sm text-sky-200 font-medium">
                Achadinhos do Mercado Livre
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://www.instagram.com/baratinhos0712/"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6C84C]"
            >
              <InstagramIcon className="w-[18px] h-[18px] text-[#F6C84C]" />
              <span>@baratinhos0712</span>
            </a>

            <a
              href="https://www.facebook.com/baratinhos0712/"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6C84C]"
            >
              <FacebookIcon className="w-[18px] h-[18px] text-[#F6C84C]" />
              <span>Página no Facebook</span>
            </a>
          </div>
        </div>

        {/* Mandatory Affiliate Transparency Disclaimer */}
        <div className="pt-6 space-y-4">
          <p className="text-sm leading-relaxed text-sky-100/95 max-w-4xl">
            <strong className="font-semibold text-white">Aviso de Transparência:</strong>{' '}
            O Baratinhos da Internet participa do Programa de Afiliados do Mercado Livre. Ao clicar
            nos links e realizar uma compra, podemos receber uma pequena comissão sem nenhum custo
            adicional para você.
          </p>

          <p className="text-xs text-sky-200/80">
            © {currentYear} Baratinhos da Internet. Preços e disponibilidade sujeitos a alteração no
            site oficial do Mercado Livre.
          </p>
        </div>
      </div>
    </footer>
  );
}
