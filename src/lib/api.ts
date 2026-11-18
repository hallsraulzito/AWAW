
// Funções de apoio para conversar com o backend (server/) e guardar o login.

const CHAVE_TOKEN = "awaw_token"
const CHAVE_USUARIO = "awaw_user"

const API_BASE = import.meta.env.VITE_API_URL || ""

export interface UsuarioApi {
  id: string
  nome: string
  email: string
  tipoUsuario: "artista" | "cliente" | "empresa" | "admin"
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(CHAVE_TOKEN)
  } catch {
    return null
  }
}

// Guarda o token e o usuário.
export function salvarSessao(token: string, usuario: UsuarioApi) {
  const role = { artista: "ARTIST", empresa: "COMPANY", admin: "ADMIN", cliente: "CLIENT" }[usuario.tipoUsuario]
  localStorage.setItem(CHAVE_TOKEN, token)
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify({ id: usuario.id, name: usuario.nome, email: usuario.email, role }))
}

export function limparSessao() {
  localStorage.removeItem(CHAVE_TOKEN)
  localStorage.removeItem(CHAVE_USUARIO)
}

interface Opcoes {
  method?: string
  corpo?: unknown
  formData?: FormData
}

// Faz chamadas ao backend, anexando o token quando existir.
export async function api<T = unknown>(url: string, opcoes: Opcoes = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()

  if (token) headers.Authorization = `Bearer ${token}`

  let body: BodyInit | undefined

  if (opcoes.formData) {
    body = opcoes.formData
  } else if (opcoes.corpo !== undefined) {
    headers["Content-Type"] = "application/json"
    body = JSON.stringify(opcoes.corpo)
  }

  const urlCompleta = `${API_BASE.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`

  let resposta: Response

  try {
    resposta = await fetch(urlCompleta, {
      method: opcoes.method || "GET",
      headers,
      body
    })
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Ele está rodando?")
  }

  const dados = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    if (resposta.status === 401 && token) limparSessao()
    throw new Error(dados?.erro || "Algo deu errado. Tente novamente.")
  }

  return dados as T
}
