
import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Search, X } from "lucide-react"
import Avatar from "./Avatar"
import { api } from "@/lib/api"
import type { UserProfile } from "@/hooks/useAuth"
import type { Sugestao } from "./util"

export function CaixaBusca({ valor, onBuscar }: { valor: string; onBuscar: (q: string) => void }) {
  const [texto, setTexto] = useState(valor)

  function enviar(e: FormEvent) {
    e.preventDefault()
    onBuscar(texto.trim())
  }

  return (
    <form onSubmit={enviar} className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar publicações"
        className="w-full rounded-full bg-neutral-100 py-2.5 pl-11 pr-10 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      {texto && (
        <button
          type="button"
          onClick={() => {
            setTexto("")
            onBuscar("")
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  )
}

interface Props {
  busca: string
  tagAtiva: string | null
  usuario: UserProfile | null
  onBuscar: (q: string) => void
  onTag: (tag: string) => void
}

export default function RightSidebar({ busca, tagAtiva, usuario, onBuscar, onTag }: Props) {
  const navigate = useNavigate()
  const meuId = usuario?.id

  const [tags, setTags] = useState<{ tag: string; total: number }[]>([])
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [seguindo, setSeguindo] = useState<Record<string, boolean>>({})

  useEffect(() => {
    api<{ tag: string; total: number }[] | null>("/api/posts/tags/em-alta")
      .then((resposta) => setTags(Array.isArray(resposta) ? resposta : []))
      .catch(() => setTags([]))
  }, [])

  useEffect(() => {
    api<Sugestao[] | null>("/api/artistas/sugestoes")
      .then((resposta) => setSugestoes(Array.isArray(resposta) ? resposta : []))
      .catch(() => setSugestoes([]))
  }, [meuId])

  async function alternarSeguir(id: string) {
    if (!meuId) return navigate("/login")

    try {
      const r = await api<{ seguindo: boolean }>(`/api/artistas/${id}/seguir`, {
        method: "POST",
      })

      setSeguindo((atual) => ({ ...atual, [id]: r.seguindo }))
    } catch {
      /* ignora */
    }
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-[320px] shrink-0 space-y-4 overflow-y-auto py-3 pl-6 lg:block">
      <CaixaBusca key={busca} valor={busca} onBuscar={onBuscar} />

      <section className="rounded-2xl bg-neutral-50 py-3">
        <h2 className="px-4 pb-2 text-xl font-extrabold">Em alta</h2>

        {tags.length === 0 && (
          <p className="px-4 pb-2 text-sm text-neutral-500">
            Use #hashtags nos seus posts para aparecer aqui.
          </p>
        )}

        {tags.map((t) => (
          <button
            key={t.tag}
            onClick={() => onTag(t.tag)}
            className={`block w-full px-4 py-2 text-left hover:bg-neutral-100 ${
              tagAtiva === t.tag ? "bg-purple-50" : ""
            }`}
          >
            <p className="font-bold">#{t.tag}</p>
            <p className="text-xs text-neutral-500">
              {t.total} {t.total === 1 ? "publicação" : "publicações"} esta semana
            </p>
          </button>
        ))}
      </section>

      <section className="rounded-2xl bg-neutral-50 py-3">
        <h2 className="px-4 pb-2 text-xl font-extrabold">Quem seguir</h2>

        {sugestoes.length === 0 && (
          <p className="px-4 pb-2 text-sm text-neutral-500">
            Nenhuma sugestão por enquanto.
          </p>
        )}

        {sugestoes.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-100">
            <Avatar nome={s.nome} foto={s.foto} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{s.nome}</p>
              <p className="truncate text-xs text-neutral-500">
                {s.categoria || "Artista"}
              </p>
            </div>

            <button
              onClick={() => alternarSeguir(s.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                seguindo[s.id]
                  ? "border border-neutral-300 bg-white text-neutral-900 hover:border-red-300 hover:text-red-600"
                  : "bg-neutral-900 text-white hover:bg-neutral-700"
              }`}
            >
              {seguindo[s.id] ? "Seguindo" : "Seguir"}
            </button>
          </div>
        ))}
      </section>

      <p className="px-4 text-xs text-neutral-400">
        © 2026 AWAW · Art Without Any Walls
      </p>
    </aside>
  )
}
