import { Link, useLocation } from "react-router-dom"
import { Home, Palette, ShoppingBag, Building2, HeartHandshake, Plus, LogIn, LogOut } from "lucide-react"
import Avatar from "./Avatar"
import type { UserProfile } from "@/hooks/useAuth"

const ITENS = [
  { to: "/feed", rotulo: "Início", Icone: Home },
  { to: "/artists", rotulo: "Artistas", Icone: Palette },
  { to: "/marketplace", rotulo: "Marketplace", Icone: ShoppingBag },
  { to: "/companies", rotulo: "Empresas", Icone: Building2 },
  { to: "/social-projects", rotulo: "Projetos Sociais", Icone: HeartHandshake },
]

interface Props {
  usuario: UserProfile | null
  onSair: () => void
  onPostar: () => void
}

export default function FeedNav({ usuario, onSair, onPostar }: Props) {
  const { pathname } = useLocation()

  return (
    <>
      {/* Menu lateral (computador/tablet). Em telas médias mostra só os ícones. */}
      <aside className="sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col justify-between px-2 py-3 md:flex xl:w-[240px] xl:px-4">
        <div>
          <Link to="/" className="inline-block rounded-full px-3 py-2 text-2xl font-black tracking-tight text-purple-600 hover:bg-purple-50">
            <span className="xl:hidden">A</span>
            <span className="hidden xl:inline">AWAW</span>
          </Link>

          <nav className="mt-2 space-y-1">
            {ITENS.map(({ to, rotulo, Icone }) => (
              <Link
                key={to}
                to={to}
                title={rotulo}
                className={`flex items-center gap-4 rounded-full px-3 py-3 text-lg transition-colors hover:bg-neutral-100 ${
                  pathname === to ? "font-bold text-neutral-900" : "text-neutral-700"
                }`}
              >
                <Icone className="h-6 w-6 shrink-0" />
                <span className="hidden xl:inline">{rotulo}</span>
              </Link>
            ))}
          </nav>

          <button
            onClick={onPostar}
            title="Publicar"
            className="mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 font-bold text-white shadow-md transition-colors hover:bg-purple-700 xl:w-full"
          >
            <Plus className="h-6 w-6 xl:hidden" />
            <span className="hidden xl:inline">Publicar</span>
          </button>
        </div>

        {usuario ? (
          <div className="flex items-center gap-3 rounded-full p-2 hover:bg-neutral-100">
            <Avatar nome={usuario.name} tamanho={40} />
            <div className="hidden min-w-0 flex-1 xl:block">
              <p className="truncate text-sm font-bold">{usuario.name}</p>
              <p className="truncate text-xs text-neutral-500">{usuario.email}</p>
            </div>
            <button onClick={onSair} title="Sair" className="hidden text-neutral-500 hover:text-red-600 md:block">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            title="Entrar"
            className="flex items-center gap-4 rounded-full px-3 py-3 font-semibold text-purple-600 hover:bg-purple-50"
          >
            <LogIn className="h-6 w-6 shrink-0" />
            <span className="hidden xl:inline">Entrar</span>
          </Link>
        )}
      </aside>

      {/* Barra inferior (celular) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-neutral-200 bg-white/95 py-2 backdrop-blur md:hidden">
        <Link to="/feed" className="p-2 text-neutral-900"><Home className="h-6 w-6" /></Link>
        <Link to="/artists" className="p-2 text-neutral-600"><Palette className="h-6 w-6" /></Link>
        <button onClick={onPostar} className="rounded-full bg-purple-600 p-3 text-white shadow-md">
          <Plus className="h-5 w-5" />
        </button>
        {usuario ? (
          <button onClick={onSair} className="p-2 text-neutral-600"><LogOut className="h-6 w-6" /></button>
        ) : (
          <Link to="/login" className="p-2 text-purple-600"><LogIn className="h-6 w-6" /></Link>
        )}
      </nav>
    </>
  )
}
