// Funções de apoio para conversar com o backend (server/) e guardar o login.

const CHAVE_TOKEN = "awaw_token"
const CHAVE_USUARIO = "awaw_user"

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

// Guarda o token (para chamar a API) e o usuário (para o useAuth mostrar o nome etc.)
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
  corpo?: unknown // objeto que vira JSON
  formData?: FormData // para enviar arquivos
}

// Faz a chamada, já anexando o token de login (se existir), e devolve o JSON.
// Se a API responder com erro, lança um Error com a mensagem em português.
export async function api<T = unknown>(url: string, opcoes: Opcoes = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let body: BodyInit | undefined
  if (opcoes.formData) {
    body = opcoes.formData // o navegador define o Content-Type sozinho
  } else if (opcoes.corpo !== undefined) {
    headers["Content-Type"] = "application/json"
    body = JSON.stringify(opcoes.corpo)
  }

  let resposta: Response
  try {
    resposta = await fetch(url, { method: opcoes.method || "GET", headers, body })
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Ele está rodando?")
  }

  const dados = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    if (resposta.status === 401 && token) limparSessao() // sessão vencida
    throw new Error(dados?.erro || "Algo deu errado. Tente novamente.")
  }
  return dados as T
}
