import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Trash2, Loader2 } from "lucide-react";
import Avatar from "./Avatar";
import { api } from "@/lib/api";
import { tempoRelativo } from "./util";
import type { Post, Comentario } from "./util";

interface Props {
  post: Post;
  meuId?: string;
  onTag: (tag: string) => void;
  onApagar: (id: string) => Promise<void>;
}

// Transforma "#pintura" dentro do texto em botões clicáveis (filtram o feed)
function TextoComTags({
  texto,
  onTag,
}: {
  texto: string;
  onTag: (tag: string) => void;
}) {
  const partes = texto.split(/(#[\p{L}\p{N}_]+)/u);
  return (
    <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
      {partes.map((parte, i) =>
        parte.startsWith("#") ? (
          <button
            key={i}
            onClick={() => onTag(parte.slice(1).toLowerCase())}
            className="text-purple-600 hover:underline"
          >
            {parte}
          </button>
        ) : (
          parte
        ),
      )}
    </p>
  );
}

function Midias({ urls }: { urls: string[] | null }) {
  const lista = Array.isArray(urls) ? urls : [];

  if (lista.length === 0) return null;

  return (
    <div
      className={`mt-3 grid gap-0.5 overflow-hidden rounded-2xl border border-neutral-200 ${
        lista.length === 1 ? "grid-cols-1" : "grid-cols-2"
      }`}
    >
      {lista.map((url, i) => {
        const destaque = lista.length === 3 && i === 0;

        return (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className={`block bg-neutral-100 ${destaque ? "row-span-2" : ""}`}
          >
            <img
              src={url}
              alt=""
              loading="lazy"
              className={`w-full object-cover ${
                lista.length === 1
                  ? "max-h-[520px]"
                  : destaque
                    ? "h-full min-h-[10rem]"
                    : "h-40 sm:h-52"
              }`}
            />
          </a>
        );
      })}
    </div>
  );
}

export default function PostCard({ post, meuId, onTag, onApagar }: Props) {
  const navigate = useNavigate();
  const [curtiu, setCurtiu] = useState(post.curtiu);
  const [totalCurtidas, setTotalCurtidas] = useState(post.totalCurtidas);
  const [totalComentarios, setTotalComentarios] = useState(
    post.totalComentarios,
  );
  const [aberto, setAberto] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[] | null>(null);
  const [novo, setNovo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const souAutor = meuId === post.autor.id;

  async function curtir() {
    if (!meuId) return navigate("/login");
    // "Atualização otimista": muda na tela na hora e confirma com o servidor depois
    const anterior = { curtiu, total: totalCurtidas };
    setCurtiu(!curtiu);
    setTotalCurtidas(totalCurtidas + (curtiu ? -1 : 1));
    try {
      const r = await api<{ curtiu: boolean; totalCurtidas: number }>(
        `/api/posts/${post.id}/curtir`,
        { method: "POST" },
      );
      setCurtiu(r.curtiu);
      setTotalCurtidas(r.totalCurtidas);
    } catch {
      setCurtiu(anterior.curtiu); // deu erro: volta como estava
      setTotalCurtidas(anterior.total);
    }
  }

  async function alternarComentarios() {
    const abrir = !aberto;
    setAberto(abrir);
    if (abrir && comentarios === null) {
      try {
        setComentarios(
          await api<Comentario[]>(`/api/posts/${post.id}/comentarios`),
        );
      } catch (e) {
        setErro(
          e instanceof Error ? e.message : "Erro ao carregar comentários.",
        );
        setComentarios([]);
      }
    }
  }

  async function comentar(e: FormEvent) {
    e.preventDefault();
    if (!novo.trim()) return;
    setEnviando(true);
    setErro("");
    try {
      const c = await api<Comentario>(`/api/posts/${post.id}/comentarios`, {
        method: "POST",
        corpo: { texto: novo },
      });
      setComentarios((lista) => [...(lista || []), c]);
      setTotalComentarios((n) => n + 1);
      setNovo("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao comentar.");
    } finally {
      setEnviando(false);
    }
  }

  async function apagar() {
    if (window.confirm("Apagar esta publicação? Isso não pode ser desfeito."))
      await onApagar(post.id);
  }

  return (
    <article className="border-b border-neutral-200 px-4 py-3 transition-colors hover:bg-neutral-50/60">
      <div className="flex gap-3">
        <Avatar nome={post.autor.nome} foto={post.autor.foto} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm">
            <Link
              to={`/artists`}
              className="truncate font-bold hover:underline"
            >
              {post.autor.nome}
            </Link>
            {post.autor.categoria && (
              <span className="truncate text-neutral-500">
                · {post.autor.categoria}
              </span>
            )}
            <span className="shrink-0 text-neutral-500">
              · {tempoRelativo(post.criadoEm)}
            </span>
            {souAutor && (
              <button
                onClick={apagar}
                title="Apagar"
                className="ml-auto rounded-full p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {post.texto && <TextoComTags texto={post.texto} onTag={onTag} />}
          <Midias urls={post.midias} />

          <div className="mt-2 flex gap-8 text-sm text-neutral-500">
            <button
              onClick={alternarComentarios}
              className="group flex items-center gap-1.5 hover:text-purple-600"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
              {totalComentarios > 0 && totalComentarios}
            </button>
            <button
              onClick={curtir}
              className={`flex items-center gap-1.5 hover:text-pink-600 ${curtiu ? "text-pink-600" : ""}`}
            >
              <Heart
                className="h-[18px] w-[18px]"
                fill={curtiu ? "currentColor" : "none"}
              />
              {totalCurtidas > 0 && totalCurtidas}
            </button>
          </div>

          {aberto && (
            <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
              {comentarios === null && (
                <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
              )}
              {comentarios?.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar
                    nome={c.autor.nome}
                    foto={c.autor.foto}
                    tamanho={28}
                  />
                  <div className="min-w-0 rounded-2xl bg-neutral-100 px-3 py-2 text-sm">
                    <span className="font-bold">{c.autor.nome}</span>{" "}
                    <span className="text-neutral-500">
                      · {tempoRelativo(c.criadoEm)}
                    </span>
                    <p className="whitespace-pre-wrap break-words">{c.texto}</p>
                  </div>
                </div>
              ))}

              {meuId ? (
                <form onSubmit={comentar} className="flex gap-2">
                  <input
                    value={novo}
                    onChange={(e) => setNovo(e.target.value)}
                    maxLength={300}
                    placeholder="Escreva um comentário"
                    className="min-w-0 flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    disabled={enviando || !novo.trim()}
                    className="rounded-full bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </form>
              ) : (
                <p className="text-sm text-neutral-500">
                  <Link
                    to="/login"
                    className="font-semibold text-purple-600 hover:underline"
                  >
                    Entre
                  </Link>{" "}
                  para comentar.
                </p>
              )}
              {erro && <p className="text-sm text-red-600">{erro}</p>}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
