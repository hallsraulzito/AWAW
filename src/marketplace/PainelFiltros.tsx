import { ARTISTAS, listarCategorias, listarProdutos } from "./catalogo";

export type ChaveFiltro = "artista" | "categoria" | "min" | "max";

interface Props {
  artista: string;
  categoria: string;
  min: string;
  max: string;
  temFiltro: boolean;
  onChange: (chave: ChaveFiltro, valor: string) => void;
  onLimpar: () => void;
}

// Botão de opção usado nas listas de artista e categoria
function Opcao({ ativo, rotulo, total, onClick }: { ativo: boolean; rotulo: string; total: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        ativo ? "bg-purple-50 font-bold text-purple-700" : "text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      <span className="truncate">{rotulo}</span>
      <span className="ml-2 text-xs text-neutral-400">{total}</span>
    </button>
  );
}

export default function PainelFiltros({ artista, categoria, min, max, temFiltro, onChange, onLimpar }: Props) {
  const categorias = listarCategorias();
  const campo =
    "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none";

  return (
    <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-neutral-900">Filtros</h2>
        {temFiltro && (
          <button onClick={onLimpar} className="text-sm font-semibold text-purple-600 hover:underline">
            Limpar
          </button>
        )}
      </div>

      <section>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Artista</h3>
        <Opcao ativo={!artista} rotulo="Todos" total={listarProdutos().length} onClick={() => onChange("artista", "")} />
        {ARTISTAS.map((a) => (
          <Opcao
            key={a.slug}
            ativo={artista === a.slug}
            rotulo={a.nome}
            total={listarProdutos({ artista: a.slug }).length}
            onClick={() => onChange("artista", a.slug)}
          />
        ))}
      </section>

      <section>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Categoria</h3>
        <Opcao ativo={!categoria} rotulo="Todas" total={listarProdutos().length} onClick={() => onChange("categoria", "")} />
        {categorias.map((c) => (
          <Opcao
            key={c}
            ativo={categoria === c}
            rotulo={c}
            total={listarProdutos({ categoria: c }).length}
            onClick={() => onChange("categoria", c)}
          />
        ))}
      </section>

      <section>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Preço (R$)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={min}
            onChange={(e) => onChange("min", e.target.value)}
            placeholder="Mín."
            className={campo}
          />
          <span className="text-neutral-400">–</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={max}
            onChange={(e) => onChange("max", e.target.value)}
            placeholder="Máx."
            className={campo}
          />
        </div>
      </section>
    </div>
  );
}
