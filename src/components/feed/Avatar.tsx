interface Props {
  nome: string
  foto?: string | null
  tamanho?: number
}

// Mostra a foto do perfil ou, se não tiver, a inicial do nome num círculo colorido.
export default function Avatar({ nome, foto, tamanho = 40 }: Props) {
  if (foto) {
    return (
      <img
        src={foto}
        alt={nome}
        style={{ width: tamanho, height: tamanho }}
        className="flex-shrink-0 rounded-full object-cover"
      />
    )
  }
  return (
    <div
      aria-hidden
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.42 }}
      className="flex flex-shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 font-bold text-white"
    >
      {nome.trim().charAt(0).toUpperCase() || "?"}
    </div>
  )
}
