import type { RouteObject } from "react-router-dom";
import MarketplaceGeral from "./MarketplaceGeral";
import ArtistaMarketplace from "./ArtistaMarketplace";
import ProdutoDetalhe from "./ProdutoDetalhe";
import { ARTISTAS } from "./catalogo";

/*
  Todas as rotas do marketplace. As rotas de cada artista são criadas a partir
  da lista ARTISTAS: ao cadastrar um artista novo no catálogo, ele ganha
  /<slug>/marketplace sozinho, sem mexer no App.tsx.

  Por que uma rota por artista, e não "/:artista/marketplace"? Porque rotas
  fixas têm prioridade sobre rotas com parâmetro e assim não brigam com
  outras como /katz/:obraId.
*/
export const rotasMarketplace: RouteObject[] = [
  { path: "/marketplace", element: <MarketplaceGeral /> },
  { path: "/marketplace/:produtoId", element: <ProdutoDetalhe /> },
  ...ARTISTAS.flatMap((a): RouteObject[] => [
    { path: `/${a.slug}/marketplace`, element: <ArtistaMarketplace slug={a.slug} /> },
    { path: `/${a.slug}/marketplace/:obraId`, element: <ProdutoDetalhe artistaSlug={a.slug} /> },
  ]),
];
