// Popula o banco com artistas e posts de EXEMPLO para você ver o feed funcionando.
// Rode com:  npm run seed   (dentro da pasta server). Só use em desenvolvimento.
import "dotenv/config";
import mongoose from "mongoose";
import { conectarBanco } from "./db";
import { User } from "./models/User.js";
import { Post } from "./models/Post.js";

const artistas = [
  { nome: "Marina Luz", email: "marina@awaw.dev", categoria: "Ilustração", cidade: "Santos" },
  { nome: "Beto Grafite", email: "beto@awaw.dev", categoria: "Grafite", cidade: "São Paulo" },
  { nome: "Clara Nunes", email: "clara@awaw.dev", categoria: "Fotografia", cidade: "Peruíbe" },
];

const textos = [
  "Primeiro esboço da série nova! Feedback é muito bem-vindo #ilustracao #processo",
  "Mural finalizado hoje, 3 dias de trabalho. A arte precisa ocupar a cidade #grafite #arteurbana",
  "Luz da manhã na praia, sem edição nenhuma #fotografia #litoral",
  "Procurando espaço para expor em Santos, alguém indica? #exposicao #arte",
  "Teste de cores com aquarela hoje #aquarela #processo",
];

async function main() {
  await conectarBanco();
  const criados = [];
  for (const a of artistas) {
    let u = await User.findOne({ email: a.email });
    if (!u) {
      u = await User.create({
        nome: a.nome, email: a.email, senha: "123456", tipoUsuario: "artista",
        artista: { nomeArtistico: a.nome, categoriaArtistica: a.categoria, cidade: a.cidade },
      });
    }
    criados.push(u);
  }
  if ((await Post.countDocuments()) === 0) {
    for (let i = 0; i < textos.length; i++) {
      const autor = criados[i % criados.length];
      const tags = [...textos[i].matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1].toLowerCase());
      await Post.create({ autor: autor._id, texto: textos[i], tags });
    }
  }
  console.log("Seed concluído. Login de teste: marina@awaw.dev / 123456");
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
