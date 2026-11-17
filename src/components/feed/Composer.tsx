import { useEffect, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import { Link } from "react-router-dom"
import { ImagePlus, X, Loader2 } from "lucide-react"
import Avatar from "./Avatar"
import { api } from "@/lib/api"
import type { UserProfile } from "@/hooks/useAuth"
import type { Post } from "./util"

const MAX_TEXTO = 500
const MAX_IMAGENS = 4
const MAX_MB = 8
const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/gif"]

interface Anexo {
  arquivo: File
  previa: string // endereço temporário só para mostrar a miniatura
}

interface Props {
  usuario: UserProfile | null
  onPublicado: (post: Post) => void
}

export default function Composer({ usuario, onPublicado }: Props) {
  const [texto, setTexto] = useState("")
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState("")
  const inputArquivo = useRef<HTMLInputElement>(null)

  // Ao sair da página, libera da memória as miniaturas que ainda estiverem abertas
  const anexosAtuais = useRef<Anexo[]>([])
  anexosAtuais.current = anexos
  useEffect(() => () => anexosAtuais.current.forEach((a) => URL.revokeObjectURL(a.previa)), [])

  if (!usuario) {
    return (
      <div className="border-b border-neutral-200 p-6 text-center">
        <p className="font-semibold">Quer compartilhar sua arte?</p>
        <p className="mt-1 text-sm text-neutral-500">Entre ou crie sua conta para publicar, curtir e comentar.</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link to="/login" className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-bold hover:bg-neutral-50">
            Entrar
          </Link>
          <Link to="/signup?type=artist" className="rounded-full bg-purple-600 px-5 py-2 text-sm font-bold text-white hover:bg-purple-700">
            Criar conta
          </Link>
        </div>
      </div>
    )
  }

  function escolherImagens(e: ChangeEvent<HTMLInputElement>) {
    const escolhidas = Array.from(e.target.files || [])
    e.target.value = "" // permite escolher o mesmo arquivo de novo depois
    setErro("")

    const validas = escolhidas.filter((f) => TIPOS.includes(f.type) && f.size <= MAX_MB * 1024 * 1024)
    if (validas.length < escolhidas.length) setErro(`Use imagens JPG, PNG, WEBP ou GIF de até ${MAX_MB} MB.`)

    const vagas = MAX_IMAGENS - anexos.length
    const novas = validas.slice(0, vagas).map((arquivo) => ({ arquivo, previa: URL.createObjectURL(arquivo) }))
    setAnexos((atuais) => [...atuais, ...novas])
  }

  function removerAnexo(indice: number) {
    URL.revokeObjectURL(anexos[indice].previa)
    setAnexos((atuais) => atuais.filter((_, i) => i !== indice))
  }

  async function publicar() {
    setErro("")
    setEnviando(true)
    try {
      // 1) envia as imagens (se houver) e recebe os endereços delas
      let midias: string[] = []
      if (anexos.length > 0) {
        const formData = new FormData()
        anexos.forEach((a) => formData.append("imagens", a.arquivo))
        midias = (await api<{ urls: string[] }>("/api/upload", { method: "POST", formData })).urls
      }
      // 2) cria o post com o texto e os endereços das imagens
      const post = await api<Post>("/api/posts", { method: "POST", corpo: { texto, midias } })

      anexos.forEach((a) => URL.revokeObjectURL(a.previa))
      setTexto("")
      setAnexos([])
      onPublicado(post)
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível publicar.")
    } finally {
      setEnviando(false)
    }
  }

  const vazio = !texto.trim() && anexos.length === 0
  const restante = MAX_TEXTO - texto.length

  return (
    <div className="flex gap-3 border-b border-neutral-200 px-4 py-3">
      <Avatar nome={usuario.name} />
      <div className="min-w-0 flex-1">
        <textarea
          id="composer-texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Compartilhe sua arte, seu processo, uma ideia... use #hashtags"
          rows={3}
          className="w-full resize-none bg-transparent pt-2 text-lg placeholder:text-neutral-400 focus:outline-none"
        />

        {anexos.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            {anexos.map((a, i) => (
              <div key={a.previa} className="relative overflow-hidden rounded-2xl border border-neutral-200">
                <img src={a.previa} alt="" className="h-36 w-full object-cover" />
                <button
                  onClick={() => removerAnexo(i)}
                  title="Remover"
                  className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {erro && <p className="mb-2 text-sm text-red-600">{erro}</p>}

        <div className="flex items-center justify-between border-t border-neutral-100 pt-2">
          <div>
            <input ref={inputArquivo} type="file" accept={TIPOS.join(",")} multiple hidden onChange={escolherImagens} />
            <button
              onClick={() => inputArquivo.current?.click()}
              disabled={anexos.length >= MAX_IMAGENS}
              title="Adicionar imagens"
              className="rounded-full p-2 text-purple-600 hover:bg-purple-50 disabled:opacity-40"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {texto.length > 0 && (
              <span className={`text-sm ${restante < 0 ? "font-bold text-red-600" : restante < 50 ? "text-amber-600" : "text-neutral-400"}`}>
                {restante}
              </span>
            )}
            <button
              onClick={publicar}
              disabled={vazio || restante < 0 || enviando}
              className="flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
              Publicar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
