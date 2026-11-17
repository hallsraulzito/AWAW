import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import FeedNav from "@/components/feed/FeedNav";
import Composer from "@/components/feed/Composer";
import PostCard from "@/components/feed/PostCard";
import RightSidebar, { CaixaBusca } from "@/components/feed/RightSidebar";
import type { Post } from "@/components/feed/util";

type Aba = "todos" | "seguindo";
interface RespostaFeed {
  posts: Post[];
  temMais: boolean;
}

const mensagemDeErro = (e: unknown) =>
  e instanceof Error ? e.message : "Algo deu errado.";

export default function Feed() {
  const { user, logout } = useAuth();
  const meuId = user?.id;

  const [aba, setAba] = useState<Aba>("todos");
  const [tag, setTag] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [temMais, setTemMais] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState("");

  // Monta o endereço da API de acordo com os filtros escolhidos
  const montarUrl = useCallback(
    (antes?: string) => {
      const p = new URLSearchParams();
      if (aba === "seguindo") p.set("aba", "seguindo");
      if (tag) p.set("tag", tag);
      if (busca) p.set("q", busca);
      if (antes) p.set("antes", antes);
      return `/api/posts?${p.toString()}`;
    },
    [aba, tag, busca],
  );

  // Sempre que a aba, a hashtag, a busca ou o login mudarem, recarrega o feed do zero
  useEffect(() => {
    if (aba === "seguindo" && !meuId) {
      setPosts([]);
      setTemMais(false);
      setCarregando(false);
      return;
    }
    let cancelado = false; // evita que uma resposta antiga sobrescreva uma mais nova
    setCarregando(true);
    setErro("");
    api<RespostaFeed>(montarUrl())
      .then((r) => {
        if (cancelado) return;

        setPosts(
          Array.isArray(r.posts)
            ? r.posts.map((post) => ({
                ...post,
                midias: Array.isArray(post.midias) ? post.midias : [],
              }))
            : [],
        );

        setTemMais(r.temMais);
      })
      .catch((e: unknown) => !cancelado && setErro(mensagemDeErro(e)))
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [aba, meuId, montarUrl]);

  async function carregarMais() {
    const ultimo = posts[posts.length - 1];
    if (!ultimo) return;
    setCarregandoMais(true);
    try {
      const r = await api<RespostaFeed>(montarUrl(ultimo.id)); // posts mais antigos que o último da tela
      setPosts((atuais) => [...atuais, ...r.posts]);
      setTemMais(r.temMais);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setCarregandoMais(false);
    }
  }

  async function apagar(id: string) {
    try {
      await api(`/api/posts/${id}`, { method: "DELETE" });
      setPosts((atuais) => atuais.filter((p) => p.id !== id));
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }

  function irParaComposer() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById("composer-texto")?.focus();
  }

  const botaoAba = (valor: Aba, rotulo: string) => (
    <button
      onClick={() => setAba(valor)}
      className={`relative flex-1 py-4 text-sm font-semibold transition-colors hover:bg-neutral-100 ${
        aba === valor ? "text-neutral-900" : "text-neutral-500"
      }`}
    >
      {rotulo}
      {aba === valor && (
        <span className="absolute inset-x-1/4 bottom-0 h-1 rounded-full bg-purple-600" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto flex max-w-[1100px] justify-center">
        <FeedNav usuario={user} onSair={logout} onPostar={irParaComposer} />

        <main className="min-h-screen w-full max-w-[600px] border-x border-neutral-200 pb-20 md:pb-0">
          <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/85 backdrop-blur">
            {/* Só no celular: logo e busca (no computador ficam nas laterais) */}
            <div className="flex items-center gap-3 px-4 pt-3 md:hidden">
              <Link to="/" className="text-xl font-black text-purple-600">
                AWAW
              </Link>
              <div className="flex-1 lg:hidden">
                <CaixaBusca key={busca} valor={busca} onBuscar={setBusca} />
              </div>
            </div>
            <div className="hidden px-4 pt-3 md:block lg:hidden">
              <CaixaBusca key={busca} valor={busca} onBuscar={setBusca} />
            </div>
            <div className="flex">
              {botaoAba("todos", "Para você")}
              {botaoAba("seguindo", "Seguindo")}
            </div>
          </header>

          {(tag || busca) && (
            <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-purple-50 px-4 py-2 text-sm">
              <span className="text-neutral-600">Filtrando por:</span>
              {tag && (
                <button
                  onClick={() => setTag(null)}
                  className="flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1 font-semibold text-white"
                >
                  #{tag} <X className="h-3.5 w-3.5" />
                </button>
              )}
              {busca && (
                <button
                  onClick={() => setBusca("")}
                  className="flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1 font-semibold text-white"
                >
                  “{busca}” <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          <Composer
            usuario={user}
            onPublicado={(novo) => setPosts((atuais) => [novo, ...atuais])}
          />

          {erro && (
            <p className="border-b border-neutral-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </p>
          )}

          {carregando ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : aba === "seguindo" && !meuId ? (
            <p className="px-6 py-12 text-center text-neutral-500">
              <Link
                to="/login"
                className="font-semibold text-purple-600 hover:underline"
              >
                Entre
              </Link>{" "}
              para ver as publicações de quem você segue.
            </p>
          ) : posts.length === 0 ? (
            <p className="px-6 py-12 text-center text-neutral-500">
              {aba === "seguindo"
                ? "Você ainda não segue ninguém, ou eles não publicaram. Veja as sugestões em “Quem seguir”."
                : "Nenhuma publicação por aqui ainda. Seja o primeiro a compartilhar sua arte!"}
            </p>
          ) : (
            <>
              {posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  meuId={meuId}
                  onTag={setTag}
                  onApagar={apagar}
                />
              ))}
              {temMais && (
                <div className="flex justify-center py-6">
                  <button
                    onClick={carregarMais}
                    disabled={carregandoMais}
                    className="flex items-center gap-2 rounded-full border border-neutral-300 px-6 py-2 text-sm font-bold hover:bg-neutral-50 disabled:opacity-60"
                  >
                    {carregandoMais && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Carregar mais
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        <RightSidebar
          busca={busca}
          tagAtiva={tag}
          usuario={user}
          onBuscar={setBusca}
          onTag={setTag}
        />
      </div>
    </div>
  );
}
