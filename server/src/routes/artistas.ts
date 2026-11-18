import { Router } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Portfolio } from "../models/Portfolio.js";
import { exigirLogin, loginOpcional } from "../middleware/auth.js";

const router = Router();

// GET /api/artistas?categoria=Pintura&cidade=Santos&pagina=1&limite=12
// Alimenta a página de listagem de artistas (Artists.tsx / ArtistGallery.tsx)
router.get("/", async (req, res) => {
  try {
    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const limite = Math.min(50, Number(req.query.limite) || 12);

    const filtro: Record<string, unknown> = {
      tipoUsuario: "artista",
      status: "ativo",
      "artista.statusPerfil": "publicado",
    };
    if (typeof req.query.categoria === "string") filtro["artista.categoriaArtistica"] = req.query.categoria;
    if (typeof req.query.cidade === "string") filtro["artista.cidade"] = req.query.cidade;

    const [artistas, total] = await Promise.all([
      User.find(filtro)
        .select("artista") // só o perfil artístico: nada de e-mail/telefone
        .sort({ "artista.nomeArtistico": 1 })
        .skip((pagina - 1) * limite)
        .limit(limite)
        .lean(),
      User.countDocuments(filtro),
    ]);

    res.json({ artistas, total, pagina, limite });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

// GET /api/artistas/sugestoes -> "Quem seguir": artistas que eu ainda não sigo.
// IMPORTANTE: esta rota fica ANTES de "/:id". Senão o Express entenderia
// a palavra "sugestoes" como se fosse um id.
router.get("/sugestoes", loginOpcional, async (_req, res) => {
  try {
    const meuId: string | undefined = res.locals.usuario?.id;
    const excluir: unknown[] = meuId ? [meuId] : [];
    if (meuId) {
      const eu = await User.findById(meuId).select("seguindo").lean();
      excluir.push(...(eu?.seguindo || []));
    }
    const artistas = await User.aggregate([
      { $match: { tipoUsuario: "artista", status: "ativo", "artista.statusPerfil": "publicado", _id: { $nin: excluir } } },
      { $sample: { size: 5 } }, // 5 aleatórios
      { $project: { artista: 1 } },
    ]);
    res.json(
      artistas.map((a) => ({
        id: String(a._id),
        nome: a.artista.nomeArtistico,
        categoria: a.artista.categoriaArtistica || "",
        foto: a.artista.fotoPerfil || null,
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

// POST /api/artistas/:id/seguir -> segue; se já segue, deixa de seguir (toggle)
router.post("/:id/seguir", exigirLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const meuId = res.locals.usuario.id;
    if (!mongoose.isValidObjectId(id) || !(await User.exists({ _id: id }))) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }
    if (id === meuId) return res.status(400).json({ erro: "Você não pode seguir a si mesmo." });

    const jaSegue = await User.exists({ _id: meuId, seguindo: id });
    await User.updateOne({ _id: meuId }, jaSegue ? { $pull: { seguindo: id } } : { $addToSet: { seguindo: id } });
    res.json({ seguindo: !jaSegue });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

// GET /api/artistas/:id  -> perfil + portfólios (para páginas como a Katz.tsx)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ erro: "Artista não encontrado." });

    const artista = await User.findOne({ _id: id, tipoUsuario: "artista" }).select("artista").lean();
    if (!artista) return res.status(404).json({ erro: "Artista não encontrado." });

    const portfolios = await Portfolio.find({ artista: id }).lean();
    const publicos = portfolios.map((p) => ({
      ...p,
      trabalhos: p.trabalhos.filter((t) => t.status === "publicado"),
    }));

    res.json({ artista, portfolios: publicos });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

// PUT /api/artistas/me  -> o próprio artista edita seu perfil (precisa de login)
router.put("/me", exigirLogin, async (req, res) => {
  try {
    const { id, tipoUsuario } = res.locals.usuario;
    if (tipoUsuario !== "artista") return res.status(403).json({ erro: "Apenas artistas." });

    const permitidos = [
      "nomeArtistico", "biografia", "dataNascimento", "cidade", "estado",
      "fotoPerfil", "categoriaArtistica", "valorHora", "disponibilidade",
    ];
    // Monta { "artista.biografia": "...", ... } para alterar só os campos enviados
    const alteracoes: Record<string, unknown> = {};
    for (const campo of permitidos) {
      if (req.body[campo] !== undefined) alteracoes[`artista.${campo}`] = req.body[campo];
    }

    const atualizado = await User.findByIdAndUpdate(id, { $set: alteracoes }, { new: true, runValidators: true })
      .select("artista")
      .lean();
    res.json(atualizado);
  } catch (e: any) {
    if (e.name === "ValidationError") return res.status(400).json({ erro: e.message });
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

export default router;
