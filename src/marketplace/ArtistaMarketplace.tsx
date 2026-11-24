import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProdutoCard from "./ProdutoCard";
import { listarProdutos, obterArtista } from "./catalogo";
import type { Ordem } from "./catalogo";

/*
  Marketplace de UM artista (ex.: /katz/marketplace). Serve para qualquer
  artista do catálogo: o "slug" decide de quem são as obras.
*/
export default function ArtistaMarketplace({ slug }: { slug: string }) {
  const [q, setQ] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("padrao");

  const artista = obterArtista(slug);
  const total = listarProdutos({ artista: slug }).length;
  const produtos = listarProdutos({ artista: slug, q, ordem });

  if (!artista) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="text-2xl font-black">Artista não encontrado</h1>
          <Link to="/marketplace" className="mt-6 inline-block font-semibold text-purple-600 hover:underline">
            Ver o marketplace geral
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <header className="border-b border-neutral-200 bg-gradient-to-br from-purple-50 via-white to-emerald-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center lg:px-8">
          <img
            src={artista.foto}
            alt={artista.nome}
            className="h-32 w-32 shrink-0 rounded-full border-4 border-white object-cover shadow-lg md:h-40 md:w-40"
          />
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-widest text-purple-600">Marketplace de</p>
            <h1 className="text-4xl font-black text-neutral-900 md:text-5xl">{artista.nome}</h1>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-neutral-500 md:justify-start">
              {artista.funcao} · <MapPin className="h-3.5 w-3.5" /> {artista.cidade}
            </p>
            <p className="mt-3 max-w-2xl text-neutral-600">{artista.bio}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                to={artista.perfil}
                className="rounded-full bg-purple-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-purple-700"
              >
                Ver perfil
              </Link>
              <Link
                to="/marketplace"
                className="rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-sm font-bold text-neutral-800 hover:bg-neutral-50"
              >
                Marketplace completo
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-bold text-neutral-800">{artista.nome} ainda não tem obras à venda</p>
            <p className="mt-1 text-sm text-neutral-500">Volte em breve ou conheça o trabalho no perfil do artista.</p>
            <Link
              to={artista.perfil}
              className="mt-5 inline-block rounded-full bg-purple-600 px-6 py-2 text-sm font-bold text-white hover:bg-purple-700"
            >
              Ver perfil de {artista.nome}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <h2 className="text-2xl font-black text-neutral-900 sm:flex-1">
                Obras à venda <span className="text-base font-semibold text-neutral-400">({total})</span>
              </h2>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar nas obras"
                  className="w-full rounded-full border border-neutral-300 bg-white py-2.5 pl-11 pr-4 text-sm focus:border-purple-500 focus:outline-none sm:w-64"
                />
              </div>
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as Ordem)}
                aria-label="Ordenar por"
                className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="padrao">Ordenar: destaque</option>
                <option value="menor-preco">Menor preço</option>
                <option value="maior-preco">Maior preço</option>
                <option value="nome">Nome (A–Z)</option>
              </select>
            </div>

            {produtos.length === 0 ? (
              <p className="py-12 text-center text-neutral-500">Nenhuma obra encontrada para essa busca.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                {produtos.map((p) => (
                  <ProdutoCard key={p.id} produto={p} mostrarArtista={false} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
