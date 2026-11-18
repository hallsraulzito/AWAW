import { Router } from "express";
import mongoose from "mongoose";
import { Post } from "../models/Post.js";
import { Comentario } from "../models/Comentario.js";
import { User } from "../models/User.js";
import { exigirLogin, loginOpcional } from "../middleware/auth.js";

const router = Router();

// Quais campos do autor mostramos no feed (nunca e-mail, telefone ou senha)
const CAMPOS_AUTOR =
  "nome tipoUsuario artista.nomeArtistico artista.fotoPerfil artista.categoriaArtistica empresa.nomeFantasia";

// Transforma o autor do banco em algo simples para o front
function formatarAutor(a: any) {
  return {
    id: String(a._id),
    nome: a.artista?.nomeArtistico || a.empresa?.nomeFantasia || a.nome,
    categoria: a.artista?.categoriaArtistica || (a.tipoUsuario === "empresa" ? "Empresa" : ""),
    foto: a.artista?.fotoPerfil || null,
  };
}

function formatarPost(p: any, meuId: string | undefined, comentarios: Map<string, number>) {
  return {
    id: String(p._id),
    texto: p.texto,
    midias: p.midias.map((m: any) => m.url),
    tags: p.tags,
    criadoEm: p.criadoEm,
    autor: formatarAutor(p.autor),
    totalCurtidas: p.curtidas.length,
    curtiu: !!meuId && p.curtidas.some((c: any) => String(c) === meuId),
    totalComentarios: comentarios.get(String(p._id)) || 0,
  };
}

// Escapa caracteres especiais para usar o texto da busca dentro de uma regex
const escapar = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------------------------------------------------------------
// GET /api/posts?aba=seguindo&tag=pintura&q=texto&antes=<id>&limite=10
// ---------------------------------------------------------------
router.get("/", loginOpcional, async (req, res) => {
  try {
    const meuId: string | undefined = res.locals.usuario?.id;
    const limite = Math.min(30, Number(req.query.limite) || 10);
    const filtro: Record<string, any> = {};

    if (req.query.aba === "seguindo") {
      if (!meuId) return res.status(401).json({ erro: "Entre para ver quem você segue." });
      const eu = await User.findById(meuId).select("seguindo").lean();
      filtro.autor = { $in: [...(eu?.seguindo || []), meuId] }; // quem sigo + eu mesmo
    }
    if (typeof req.query.tag === "string" && req.query.tag) {
      filtro.tags = req.query.tag.toLowerCase().replace(/^#/, "");
    }
    if (typeof req.query.q === "string" && req.query.q.trim()) {
      filtro.texto = { $regex: escapar(req.query.q.trim()), $options: "i" };
    }
    // Paginação por cursor: "me dê os posts mais antigos que este id".
    // Funciona melhor que skip/limit em feeds, pois não repete post quando
    // alguém publica algo novo enquanto você rola a página.
    if (typeof req.query.antes === "string" && mongoose.isValidObjectId(req.query.antes)) {
      filtro._id = { $lt: req.query.antes };
    }

    // Busca 1 a mais só para saber se ainda existem posts depois
    const posts = await Post.find(filtro)
      .sort({ _id: -1 })
      .limit(limite + 1)
      .populate("autor", CAMPOS_AUTOR)
      .lean();

    const temMais = posts.length > limite;
    const pagina = posts.slice(0, limite);

    // Conta os comentários de todos os posts da página em UMA consulta
    const contagem = await Comentario.aggregate([
      { $match: { post: { $in: pagina.map((p) => p._id) } } },
      { $group: { _id: "$post", total: { $sum: 1 } } },
    ]);
    const comentarios = new Map<string, number>(contagem.map((c) => [String(c._id), c.total]));

    res.json({
      posts: pagina.filter((p) => p.autor).map((p) => formatarPost(p, meuId, comentarios)),
      temMais,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

// ---------------------------------------------------------------
// GET /api/posts/tags/em-alta  -> hashtags mais usadas nos últimos 7 dias
// ---------------------------------------------------------------
router.get("/tags/em-alta", async (_req, res) => {
  try {
    const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tags = await Post.aggregate([
      { $match: { criadoEm: { $gte: desde } } },
      { $unwind: "$tags" }, // um documento por hashtag
      { $group: { _id: "$tags", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 6 },
    ]);
    res.json(tags.map((t) => ({ tag: t._id, total: t.total })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

// ---------------------------------------------------------------
// POST /api/posts  -> publicar (precisa de login)
// body: { texto?: string, midias?: string[] }  (urls devolvidas por /api/upload)
// ---------------------------------------------------------------
router.post("/", exigirLogin, async (req, res) => {
  try {
    const texto = String(req.body.texto || "").trim();
    const midias: string[] = Array.isArray(req.body.midias) ? req.body.midias : [];

    if (!texto && midias.length === 0) return res.status(400).json({ erro: "Escreva algo ou envie uma imagem." });
    if (texto.length > 500) return res.status(400).json({ erro: "O texto pode ter no máximo 500 caracteres." });
    if (midias.length > 4) return res.status(400).json({ erro: "Máximo de 4 imagens." });
    // Só aceitamos imagens que passaram pelo nosso upload (evita links externos maliciosos)
    if (!midias.every((u) => typeof u === "string" && /^\/uploads\/[\w-]+\.(jpg|png|webp|gif)$/.test(u))) {
      return res.status(400).json({ erro: "Imagem inválida." });
    }

    // Extrai #hashtags do texto (aceita acentos): "#Pintura #arte_urbana"
    const tags = [...new Set([...texto.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1].toLowerCase()))].slice(0, 10);

    const post = await Post.create({
      autor: res.locals.usuario.id,
      texto,
      midias: midias.map((url) => ({ url })),
      tags,
    });
    const completo = await Post.findById(post._id).populate("autor", CAMPOS_AUTOR).lean();
    res.status(201).json(formatarPost(completo, res.locals.usuario.id, new Map()));
  } catch (e: any) {
    if (e.name === "ValidationError") return res.status(400).json({ erro: e.message });
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

// ---------------------------------------------------------------
// DELETE /api/posts/:id  -> só o autor (ou admin) apaga
// ---------------------------------------------------------------
router.delete("/:id", exigirLogin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ erro: "Post não encontrado." });

    const post = await Post.findById(id).select("autor");
    if (!post) return res.status(404).json({ erro: "Post não encontrado." });

    const { id: meuId, tipoUsuario } = res.locals.usuario;
    if (String(post.autor) !== meuId && tipoUsuario !== "admin") {
      return res.status(403).json({ erro: "Você só pode apagar seus próprios posts." });
    }
    await Promise.all([post.deleteOne(), Comentario.deleteMany({ post: id })]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

// ---------------------------------------------------------------
// POST /api/posts/:id/curtir  -> curte; se já curtiu, descurte (toggle)
// ---------------------------------------------------------------
router.post("/:id/curtir", exigirLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const meuId = res.locals.usuario.id;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ erro: "Post não encontrado." });

    const jaCurtiu = await Post.exists({ _id: id, curtidas: meuId });
    // $addToSet nunca duplica; $pull remove. Operações atômicas no banco.
    await Post.updateOne({ _id: id }, jaCurtiu ? { $pull: { curtidas: meuId } } : { $addToSet: { curtidas: meuId } });

    const post = await Post.findById(id).select("curtidas").lean();
    if (!post) return res.status(404).json({ erro: "Post não encontrado." });
    res.json({ curtiu: !jaCurtiu, totalCurtidas: post.curtidas.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

// ---------------------------------------------------------------
// Comentários
// ---------------------------------------------------------------
function formatarComentario(c: any) {
  return { id: String(c._id), texto: c.texto, criadoEm: c.criadoEm, autor: formatarAutor(c.autor) };
}

// GET /api/posts/:id/comentarios
router.get("/:id/comentarios", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ erro: "Post não encontrado." });
    const lista = await Comentario.find({ post: req.params.id })
      .sort({ criadoEm: 1 })
      .limit(100)
      .populate("autor", CAMPOS_AUTOR)
      .lean();
    res.json(lista.filter((c) => c.autor).map(formatarComentario));
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

// POST /api/posts/:id/comentarios  { texto }
router.post("/:id/comentarios", exigirLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const texto = String(req.body.texto || "").trim();
    if (!mongoose.isValidObjectId(id) || !(await Post.exists({ _id: id }))) {
      return res.status(404).json({ erro: "Post não encontrado." });
    }
    if (!texto || texto.length > 300) {
      return res.status(400).json({ erro: "O comentário precisa ter de 1 a 300 caracteres." });
    }
    const novo = await Comentario.create({ post: id, autor: res.locals.usuario.id, texto });
    const completo = await Comentario.findById(novo._id).populate("autor", CAMPOS_AUTOR).lean();
    res.status(201).json(formatarComentario(completo));
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

export default router;
