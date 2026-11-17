export interface Autor {
  id: string
  nome: string
  categoria: string
  foto: string | null
}

export interface Post {
  id: string
  texto: string
  midias: string[]
  tags: string[]
  criadoEm: string
  autor: Autor
  totalCurtidas: number
  curtiu: boolean
  totalComentarios: number
}

export interface Comentario {
  id: string
  texto: string
  criadoEm: string
  autor: Autor
}

export interface Sugestao {
  id: string
  nome: string
  categoria: string
  foto: string | null
}

// "agora", "5 min", "3 h", "2 d" ou a data (ex.: "12 de out.")
export function tempoRelativo(iso: string): string {
  const seg = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seg < 60) return "agora"
  const min = Math.floor(seg / 60)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} d`
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
}
