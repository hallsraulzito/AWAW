import { Router } from "express";
import mongoose from "mongoose";
import { Conversa, Mensagem } from "../models/Conversa";
import { Contratacao } from "../models/Contratacao";
import { exigirLogin } from "../middleware/auth";

const router = Router();

// GET /api/conversas
router.get("/", exigirLogin, async (req, res) => {
  try {
    const { id, tipoUsuario } = res.locals.usuario;

    const conversas = await Conversa.find({
      $or: [{ artista: id }, { usuario: id }],
    })
      .sort({ atualizadoEm: -1 })
      .lean();

    const arquivadas = conversas.filter((conversa) => {
      if (tipoUsuario === "artista") {
        return conversa.artistaArquivou;
      }
      return conversa.usuarioArquivou;
    });

    const conversasAtivas = conversas.filter((conversa) => {
      if (tipoUsuario === "artista") {
        return !conversa.artistaArquivou;
      }
      return !conversa.usuarioArquivou;
    });

    res.json({
      conversas: conversasAtivas,
      arquivadas,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

// GET /api/conversas/:id
router.get("/:id", exigirLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: usuarioId } = res.locals.usuario;
    if (!mongoose.isValidObjectId(id))
      return res.status(404).json({ erro: "Conversa não encontrada." });

    const conversa = await Conversa.findOne({
      _id: id,
      $or: [{ artista: usuarioId }, { usuario: usuarioId }],
    }).lean();
    if (!conversa)
      return res.status(404).json({ erro: "Conversa não encontrada." });
    const mensagens = await Mensagem.find({
      conversa: conversa._id,
    })
      .sort({
        dataEnvio: 1,
      })
      .lean();

    res.json({ conversa, mensagens });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

// POST /api/conversas/:id/mensagens
router.post("/:id/mensagens", exigirLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: usuarioId } = res.locals.usuario;

    // Valida usuario logado
    if (!mongoose.isValidObjectId(id))
      return res.status(404).json({ erro: "Conversa não encontrada." });

    // Verifica se a conversa existe e pertence ao usuário logado
    const conversa = await Conversa.findOne({
      _id: id,
      $or: [{ artista: usuarioId }, { usuario: usuarioId }],
    });

    if (!conversa)
      return res.status(404).json({ erro: "Conversa não encontrada." });

    if (conversa.status !== "ativa") {
      return res.status(403).json({ erro: "Esta conversa está encerrada." });
    }

    // Valida conteúdo da mensagem
    const conteudo = req.body.conteudo;
    if (!conteudo || typeof conteudo !== "string" || conteudo.trim() === "") {
      return res.status(400).json({ erro: "Conteúdo da mensagem inválido." });
    }

    // Cria a mensagem e salva no banco
    const mensagem = await Mensagem.create({
      conversa: conversa._id,
      remetente: usuarioId,
      conteudo: conteudo.trim(),
    });

    // Atualiza a data de atualização da conversa
    await Conversa.findByIdAndUpdate(conversa._id, {
      atualizadoEm: new Date(),
    }).exec();

    res.status(201).json(mensagem);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

// PATCH /api/conversas/:id/arquivamento
router.patch("/:id/arquivamento", exigirLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: usuarioId, tipoUsuario } = res.locals.usuario;

    // Verifica quem está arquivando a conversa (artista ou usuário)
    const campoArquivamento =
      tipoUsuario === "artista" ? "artistaArquivou" : "usuarioArquivou";

    // Valida usuario logado
    if (!mongoose.isValidObjectId(id))
      return res.status(404).json({ erro: "Conversa não encontrada." });

    // Verifica se a conversa existe e pertence ao usuário logado
    const conversa = await Conversa.findOne({
      _id: id,
      $or: [{ artista: usuarioId }, { usuario: usuarioId }],
    });

    if (!conversa)
      return res.status(404).json({ erro: "Conversa não encontrada." });

    // Atualiza o campo de arquivamento
    const { arquivada } = req.body;
    if (typeof arquivada !== "boolean") {
      return res.status(400).json({ erro: "Valor de arquivamento inválido." });
    }
    conversa[campoArquivamento] = arquivada;
    await conversa.save();
    res.json(conversa);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

// PATCH /api/conversas/:id/visualizadas
router.patch("/:id/visualizadas", exigirLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: usuarioId } = res.locals.usuario;

    // Valida o ID da conversa
    if (!mongoose.isValidObjectId(id))
      return res.status(404).json({ erro: "Conversa não encontrada." });

    // Verifica se a conversa existe e pertence ao usuário logado
    const conversa = await Conversa.findOne({
      _id: id,
      $or: [{ artista: usuarioId }, { usuario: usuarioId }],
    });

    if (!conversa)
      return res.status(404).json({ erro: "Conversa não encontrada." });

    // Atualiza o campo de visualização
    await Mensagem.updateMany(
      {
        // Apenas marca como visualizada as mensagens que não foram enviadas pelo usuário logado
        conversa: id,
        visualizada: false,
        remetente: { $ne: usuarioId },
      },
      { visualizada: true },
    );
    res.json("Mensagens marcadas como visualizadas.");
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

export default router;