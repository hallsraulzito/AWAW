/*
  CATÁLOGO DO MARKETPLACE
  ----------------------------------------------------------------------
  Esta é a ÚNICA fonte de dados do marketplace. As três telas usam isto:
    - /marketplace                       -> marketplace geral (todos os artistas)
    - /<artista>/marketplace             -> marketplace de um artista (ex.: /katz/marketplace)
    - /marketplace/<id-da-obra>          -> página da obra

  Hoje os dados ficam aqui no código. As funções no final do arquivo
  (listarProdutos, obterProduto...) são o "ponto de troca": quando os produtos
  estiverem no MongoDB (model Produto), basta reescrevê-las para chamar a API
  e o resto do site continua igual.

  COMO ADICIONAR UM ARTISTA
    1) Coloque um objeto em ARTISTAS (o "slug" vira a URL: /slug/marketplace).
    2) Adicione os produtos dele em PRODUTOS, com artista: "slug".
    A rota /slug/marketplace é criada sozinha (veja rotas.tsx).
*/
import { obras as obrasKatz } from "@/Katz/Obras.ts";

export interface ArtistaMkt {
  slug: string; // usado na URL: /katz/marketplace
  nome: string;
  funcao: string; // ex.: "Artista visual"
  categoria: string;
  cidade: string;
  foto: string;
  bio: string;
  perfil: string; // rota da página de perfil do artista
}

export interface ProdutoMkt {
  id: string; // único em todo o marketplace, ex.: "katz-obra1"
  artista: string; // slug do artista
  titulo: string;
  descricao: string;
  preco: number; // em reais
  imagem: string;
  categoria: string;
}

export type Ordem = "padrao" | "menor-preco" | "maior-preco" | "nome";

export interface Filtros {
  q?: string;
  artista?: string;
  categoria?: string;
  min?: number;
  max?: number;
  ordem?: Ordem;
}

// ---------------------------------------------------------------------
// ARTISTAS
// ---------------------------------------------------------------------
export const ARTISTAS: ArtistaMkt[] = [
  {
    slug: "katz",
    nome: "Katz",
    funcao: "Artista visual",
    categoria: "Desenho & Ilustração",
    cidade: "Peruíbe-SP",
    foto: "/img/Katz/Retrato Kat (2).jpeg",
    bio: "Artista que transforma moda, arte e criatividade em traços, formas e ideias, dando vida a inspirações através de desenhos, croquis e projetos visuais.",
    perfil: "/katz",
  },
  {
    slug: "mazz",
    nome: "Mazz",
    funcao: "Cantor & Compositor",
    categoria: "Música & Composição",
    cidade: "Peruíbe-SP",
    foto: "/img/Mazz/Retrato Mazz.jpg",
    bio: "Artista com várias composições envolvendo poemas e músicas, abordando temas como amor, desilusão, superação e reflexões internas.",
    perfil: "/mazz",
  },
];

// ---------------------------------------------------------------------
// PRODUTOS
// ---------------------------------------------------------------------

// "R$ 5.500,00" -> 5500
function precoParaNumero(texto: string): number {
  const n = Number(texto.replace(/[^\d,]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

// Katz: montado a partir de src/Katz/Obras.ts (a mesma fonte da página de cada obra).
// Para mudar título, descrição ou preço de uma obra, edite lá.
// Obras sem título ou descrição recebem um texto provisório.
const produtosKatz: ProdutoMkt[] = Object.entries(obrasKatz).map(([chave, obra]) => {
  const numero = Number(chave.replace("obra", ""));
  return {
    id: `katz-${chave}`,
    artista: "katz",
    titulo: obra.titulo || `Obra ${numero}`,
    descricao:
      obra.descricao ||
      "Obra autoral de Katz. Fale com a artista para saber técnica, dimensões e disponibilidade.",
    preco: precoParaNumero(obra.preco),
    imagem: `/img/Katz/obra ${numero}.jpeg`,
    categoria: "Desenho & Ilustração",
  };
});

// Mazz: ainda não tem obras à venda cadastradas.
// Quando tiver, adicione aqui, por exemplo:
//   {
//     id: "mazz-1",
//     artista: "mazz",
//     titulo: "Nome da composição",
//     descricao: "Sobre a obra...",
//     preco: 150,
//     imagem: "/img/Mazz/capa-1.jpg",
//     categoria: "Música & Composição",
//   },
const produtosMazz: ProdutoMkt[] = [];

export const PRODUTOS: ProdutoMkt[] = [...produtosKatz, ...produtosMazz];

// ---------------------------------------------------------------------
// FUNÇÕES DE CONSULTA (ponto de troca para a API no futuro)
// ---------------------------------------------------------------------
const normalizar = (t: string) =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function obterArtista(slug: string): ArtistaMkt | undefined {
  return ARTISTAS.find((a) => a.slug === slug);
}

export function obterProduto(id: string): ProdutoMkt | undefined {
  return PRODUTOS.find((p) => p.id === id);
}

export function listarCategorias(): string[] {
  return [...new Set(PRODUTOS.map((p) => p.categoria))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function listarProdutos(filtros: Filtros = {}): ProdutoMkt[] {
  const termo = filtros.q ? normalizar(filtros.q.trim()) : "";

  const lista = PRODUTOS.filter((p) => {
    if (filtros.artista && p.artista !== filtros.artista) return false;
    if (filtros.categoria && p.categoria !== filtros.categoria) return false;
    if (filtros.min !== undefined && p.preco < filtros.min) return false;
    if (filtros.max !== undefined && p.preco > filtros.max) return false;
    if (termo) {
      const artista = obterArtista(p.artista);
      const texto = normalizar(`${p.titulo} ${p.descricao} ${p.categoria} ${artista?.nome ?? ""}`);
      if (!texto.includes(termo)) return false;
    }
    return true;
  });

  switch (filtros.ordem) {
    case "menor-preco":
      return [...lista].sort((a, b) => a.preco - b.preco);
    case "maior-preco":
      return [...lista].sort((a, b) => b.preco - a.preco);
    case "nome":
      return [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
    default:
      return lista;
  }
}
