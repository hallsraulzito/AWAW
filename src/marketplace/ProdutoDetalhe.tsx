import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProdutoCard from "./ProdutoCard";
import { formatarPreco, listarProdutos, obterArtista, obterProduto } from "./catalogo";

/*
  Página de uma obra. Atende duas URLs:
    /marketplace/katz-obra1        (id completo)
    /katz/marketplace/obra1        (formato antigo da Katz; recebe artistaSlug + obraId)
*/
export default function ProdutoDetalhe({ artistaSlug }: { artistaSlug?: string }) {
  const { produtoId, obraId } = useParams();
  const [aviso, setAviso] = useState(false);

  const id = artistaSlug && obraId ? `${artistaSlug}-${obraId}` : produtoId;
  const produto = id ? obterProduto(id) : undefined;
  const artista = produto ? obterArtista(produto.artista) : undefined;

  if (!produto || !artista) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="text-2xl font-black">Obra não encontrada</h1>
          <Link to="/marketplace" className="mt-6 inline-block font-semibold text-purple-600 hover:underline">
            Voltar ao marketplace
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const outras = listarProdutos({ artista: artista.slug })
    .filter((p) => p.id !== produto.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav aria-label="Navegação" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-neutral-500">
          <Link to="/marketplace" className="hover:text-purple-600">Marketplace</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/${artista.slug}/marketplace`} className="hover:text-purple-600">{artista.nome}</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-neutral-800">{produto.titulo}</span>
        </nav>

        <section className="grid gap-8 md:grid-cols-2 md:gap-12">
          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
            <img src={produto.imagem} alt={produto.titulo} className="w-full object-cover" />
          </div>

          <div>
            <span className="inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
              {produto.categoria}
            </span>
            <h1 className="mt-3 text-3xl font-black text-neutral-900 md:text-4xl">{produto.titulo}</h1>
            <p className="mt-3 text-3xl font-black text-purple-600">{formatarPreco(produto.preco)}</p>
            <p className="mt-5 leading-relaxed text-neutral-600">{produto.descricao}</p>

            <Link
              to={`/${artista.slug}/marketplace`}
              className="mt-6 flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <img src={artista.foto} alt={artista.nome} className="h-14 w-14 rounded-full object-cover" />
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-400">Artista</span>
                <span className="block font-bold text-neutral-900">{artista.nome}</span>
                <span className="block text-sm text-neutral-500">{artista.funcao}</span>
              </span>
            </Link>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setAviso(true)}
                className="flex items-center gap-2 rounded-full bg-purple-600 px-8 py-3 font-bold text-white shadow-md transition-colors hover:bg-purple-700"
              >
                <ShoppingBag className="h-5 w-5" />
                Comprar obra
              </button>
              <Link
                to={artista.perfil}
                className="rounded-full border border-neutral-300 bg-white px-8 py-3 font-bold text-neutral-800 hover:bg-neutral-50"
              >
                Ver perfil
              </Link>
            </div>

            {aviso && (
              <p role="status" className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                O pagamento online ainda está em desenvolvimento. Para comprar esta obra, entre em contato com{" "}
                {artista.nome} pelo{" "}
                <Link to={artista.perfil} className="font-bold underline">perfil do artista</Link>.
              </p>
            )}
          </div>
        </section>

        {outras.length > 0 && (
          <section className="mt-16">
            <div className="mb-5 flex items-end justify-between">
              <h2 className="text-2xl font-black text-neutral-900">Mais obras de {artista.nome}</h2>
              <Link to={`/${artista.slug}/marketplace`} className="text-sm font-semibold text-purple-600 hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {outras.map((p) => (
                <ProdutoCard key={p.id} produto={p} mostrarArtista={false} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
