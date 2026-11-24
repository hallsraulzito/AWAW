import { Link } from "react-router-dom";
import { formatarPreco, obterArtista } from "./catalogo";
import type { ProdutoMkt } from "./catalogo";

interface Props {
  produto: ProdutoMkt;
  mostrarArtista?: boolean; // esconda na página do próprio artista
}

export default function ProdutoCard({ produto, mostrarArtista = true }: Props) {
  const artista = obterArtista(produto.artista);
  const destino = `/marketplace/${produto.id}`;

  return (
    <article className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-lg">
      <Link to={destino} className="block aspect-[3/4] overflow-hidden bg-neutral-100">
        <img
          src={produto.imagem}
          alt={produto.titulo}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="p-4">
        {mostrarArtista && artista && (
          <Link
            to={`/${artista.slug}/marketplace`}
            className="text-xs font-semibold uppercase tracking-wide text-purple-600 hover:underline"
          >
            {artista.nome}
          </Link>
        )}
        <h3 className="mt-1 truncate text-lg font-bold text-neutral-900">{produto.titulo}</h3>
        <p className="truncate text-xs text-neutral-500">{produto.categoria}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-lg font-black text-neutral-900">{formatarPreco(produto.preco)}</span>
          <Link
            to={destino}
            className="rounded-full bg-purple-600 px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-purple-700"
          >
            Ver obra
          </Link>
        </div>
      </div>
    </article>
  );
}
