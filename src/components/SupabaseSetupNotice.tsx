import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Copy, Database, KeyRound } from 'lucide-react';
import { SUPABASE_SETUP_SQL } from '../lib/supabase';

const ENV_SNIPPET = `VITE_SUPABASE_URL="https://SEU-PROJETO.supabase.co"
VITE_SUPABASE_ANON_KEY="SUA_CHAVE_ANON_PUBLICA"`;

export function SupabaseSetupNotice() {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const handleCopy = async (text: string, type: 'env' | 'sql') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'env') {
        setCopiedEnv(true);
        setTimeout(() => setCopiedEnv(false), 2000);
      } else {
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2000);
      }
    } catch {
      // Clipboard API unavailable in restricted context
    }
  };

  return (
    <section
      aria-label="Configuração do Supabase"
      className="max-w-3xl mx-auto my-8 sm:my-12 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1E4E8C]/10 text-[#1E4E8C] flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E4E8C] tracking-tight">
              Conecte seu projeto Supabase para ativar a vitrine
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
              Esta aplicação utiliza exclusivamente o Supabase para armazenar produtos, imagens e
              autenticação administrativa, sem nenhum armazenamento local no navegador. Configure as
              duas variáveis de ambiente abaixo para começar.
            </p>
          </div>
        </div>

        {/* Step 1: Environment Variables */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1E4E8C]">
              <KeyRound className="w-4 h-4 text-[#379BD7]" aria-hidden="true" />
              <span>1. Variáveis de Ambiente (.env ou Secrets do GitHub Pages)</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(ENV_SNIPPET, 'env')}
              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#379BD7] text-xs font-semibold text-slate-700 hover:text-[#1E4E8C] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              {copiedEnv ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar .env</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-900 text-sky-100 text-xs sm:text-sm overflow-x-auto font-mono leading-relaxed">
            <code>{ENV_SNIPPET}</code>
          </pre>
        </div>

        {/* Step 2: Collapsible SQL Script */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#1E4E8C]">
                2. Tabela de Produtos e Bucket <code className="font-mono text-[#379BD7]">vitrine-images</code>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Execute no SQL Editor do Supabase e crie seu usuário administrador em Authentication → Users.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(SUPABASE_SETUP_SQL, 'sql')}
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#1E4E8C] hover:bg-[#173d6e] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#F6C84C]" />
                    <span>SQL Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowSql((prev) => !prev)}
                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#379BD7] text-xs font-semibold text-slate-700 hover:text-[#1E4E8C] inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
              >
                <span>{showSql ? 'Ocultar SQL' : 'Ver SQL'}</span>
                {showSql ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {showSql && (
            <pre className="mt-3 p-4 rounded-xl bg-slate-900 text-slate-100 text-xs overflow-x-auto max-h-72 font-mono leading-relaxed">
              <code>{SUPABASE_SETUP_SQL}</code>
            </pre>
          )}
        </div>
      </div>
    </section>
  );
}
