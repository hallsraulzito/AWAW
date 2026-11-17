import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import Navbar from "@/components/Navbar"
import { api, salvarSessao } from "@/lib/api"
import type { UsuarioApi } from "@/lib/api"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setErro("")
    setEnviando(true)
    try {
      const r = await api<{ token: string; usuario: UsuarioApi }>("/api/auth/login", {
        method: "POST",
        corpo: { email, senha },
      })
      salvarSessao(r.token, r.usuario)
      navigate("/feed")
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <div className="mx-auto mt-16 w-full max-w-md rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-neutral-900">Entrar</h1>
        <p className="mt-1 text-sm text-neutral-500">Acesse sua conta para publicar e interagir.</p>

        <form onSubmit={entrar} className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 focus:border-purple-500 focus:outline-none"
          />
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 focus:border-purple-500 focus:outline-none"
          />
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <button
            disabled={enviando}
            className="w-full rounded-full bg-purple-600 py-3 font-bold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Ainda não tem conta?{" "}
          <Link to="/signup?type=artist" className="font-semibold text-purple-600 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
