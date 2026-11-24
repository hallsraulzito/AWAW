import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProdutoCard from "./ProdutoCard";
import PainelFiltros from "./PainelFiltros";
import type { ChaveFiltro } from "./PainelFiltros";
import { ARTISTAS, listarProdutos } from "./catalogo";
import type { Ordem } from "./catalogo";

// Lê um número da URL (ou undefined se vazio/inválido)
const numero = (valor: string | null) => {
  const n = Number(valor);
  return valor && Number.isFinite(n) && n >= 0 ? n : undefined;
};

/*
  Marketplace geral. Os filtros ficam na URL (?artista=katz&q=royalty&ordem=menor-preco),
  então qualquer busca pode ser compartilhada ou aberta direto por um link.
*/
export default function MarketplaceGeral() {
  const [params, setParams] = useSearchParams();
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const q = params.get("q") ?? "";
  const artista = params.get("artista") ?? "";
  const categoria = params.get("categoria") ?? "";
  const min = params.get("min") ?? "";
  const max = params.get("max") ?? "";
  const ordem = (params.get("ordem") as Ordem) || "padrao";

  function definir(chave: string, valor: string) {
    const novo = new URLSearchParams(params);
    if (valor) novo.set(chave, valor);
    else novo.delete(chave);
    setParams(novo, { replace: true }); // replace: digitar na busca não enche o histórico
  }

  const produtos = listarProdutos({ q, artista, categoria, min: numero(min), max: numero(max), ordem });
  const temFiltro = !!(q || artista || categoria || min || max);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <header className="bg-gradient-to-br from-purple-700 via-purple-600 to-fuchsia-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-purple-200">Marketplace</p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">Arte original, direto do artista</h1>
          <p className="mt-3 max-w-2xl text-purple-100">
            Descubra e compre obras de artistas independentes da comunidade AWAW.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Atalho para o marketplace de cada artista */}
        <section aria-label="Marketplace por artista" className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">Explore por artista</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {ARTISTAS.map((a) => (
              <Link
                key={a.slug}
                to={`/${a.slug}/marketplace`}
                className="flex shrink-0 items-center gap-3 rounded-full border border-neutral-200 bg-white py-2 pl-2 pr-5 transition-shadow hover:shadow-md"
              >
                <img src={a.foto} alt={a.nome} className="h-11 w-11 rounded-full object-cover" />
                <span>
                  <span className="block text-sm font-bold leading-tight">{a.nome}</span>
                  <span className="block text-xs text-neutral-500">
                    {listarProdutos({ artista: a.slug }).length} obras
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Busca e ordenação */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={q}
              onChange={(e) => definir("q", e.target.value)}
              placeholder="Buscar obras, artistas ou categorias"
              className="w-full rounded-full border border-neutral-300 bg-white py-3 pl-11 pr-10 text-sm focus:border-purple-500 focus:outline-none"
            />
            {q && (
              <button
                onClick={() => definir("q", "")}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <select
            value={ordem}
            onChange={(e) => definir("ordem", e.target.value === "padrao" ? "" : e.target.value)}
            aria-label="Ordenar por"
            className="rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm focus:border-purple-500 focus:outline-none"
          >
            <option value="padrao">Ordenar: destaque</option>
            <option value="menor-preco">Menor preço</option>
            <option value="maior-preco">Maior preço</option>
            <option value="nome">Nome (A–Z)</option>
          </select>

          <button
            onClick={() => setFiltrosAbertos(!filtrosAbertos)}
            className="flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className={`${filtrosAbertos ? "block" : "hidden"} lg:block`}>
            <div className="lg:sticky lg:top-24">
              <PainelFiltros
                artista={artista}
                categoria={categoria}
                min={min}
                max={max}
                temFiltro={temFiltro}
                onChange={(chave: ChaveFiltro, valor) => definir(chave, valor)}
                onLimpar={() => setParams({}, { replace: true })}
              />
            </div>
          </aside>

          <section>
            <p className="mb-4 text-sm text-neutral-500">
              {produtos.length} {produtos.length === 1 ? "obra encontrada" : "obras encontradas"}
            </p>

            {produtos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
                <p className="text-lg font-bold text-neutral-800">Nenhuma obra encontrada</p>
                <p className="mt-1 text-sm text-neutral-500">Tente outra busca ou remova alguns filtros.</p>
                {temFiltro && (
                  <button
                    onClick={() => setParams({}, { replace: true })}
                    className="mt-5 rounded-full bg-purple-600 px-6 py-2 text-sm font-bold text-white hover:bg-purple-700"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                {produtos.map((p) => (
                  <ProdutoCard key={p.id} produto={p} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
