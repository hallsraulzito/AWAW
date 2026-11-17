import { Router } from "express";
import mongoose from "mongoose";
import { Proposta } from "../models/Proposta";
import { Conversa } from "../models/Conversa";
import { Contratacao } from "../models/Contratacao";
import { exigirLogin } from "../middleware/auth";

const conversaRouter = Router();
const propostaRouter = Router();

// POST /api/conversas/:id/propostas
conversaRouter.post("/:id/propostas", exigirLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: usuarioId } = res.locals.usuario;

    // Verifica se a conversa existe e se o usuário tem permissão para enviar uma proposta
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ erro: "Conversa não encontrada." });
    }
    const conversa = await Conversa.findOne({
      _id: id,
      $or: [{ artista: usuarioId }, { usuario: usuarioId }],
    });
    if (!conversa) {
      return res.status(404).json({ erro: "Conversa não encontrada." });
    }
    if (conversa.status !== "ativa") {
      return res.status(403).json({ erro: "Esta conversa está encerrada." });
    }

    // Cria a proposta
    const contratacao = await Contratacao.findById(conversa.contratacao);

    if (!contratacao) {
      return res.status(404).json({ erro: "Contratação não encontrada." });
    }
    if (
      ["aceita", "em_andamento", "concluida", "cancelada"].includes(
        contratacao.status,
      )
    ) {
      return res
        .status(403)
        .json({ erro: "Esta contratação não aceita novas propostas." });
    }

    if (
      !contratacao.artista.equals(conversa.artista) ||
      !contratacao.contratante.equals(conversa.usuario)
    ) {
      return res.status(403).json({
        erro: "A contratação não corresponde aos participantes da conversa.",
      });
    }

    // Verifica se já existe uma proposta pendente para esta contratação
    const propostaPendente = await Proposta.findOne({
      contratacao: contratacao._id,
      status: "pendente",
    });

    if (propostaPendente) {
      return res.status(409).json({
        erro: "Já existe uma proposta pendente nesta contratação.",
      });
    }

    const destinatario =
      conversa.artista.toString() === usuarioId
        ? conversa.usuario
        : conversa.artista;

    // Valida os campos da proposta
    const {
      valor,
      descricao,
      prazoEntrega,
      dataServico,
      horaInicio,
      horaFim,
      formaPagamento,
    } = req.body;

    // Valida os campos obrigatórios
    if (
      typeof valor !== "number" ||
      valor < 0 ||
      typeof descricao !== "string" ||
      !descricao.trim() ||
      typeof formaPagamento !== "string" ||
      !formaPagamento.trim()
    ) {
      return res.status(400).json({
        erro: "Informe um valor, uma descrição e uma forma de pagamento válidos.",
      });
    }

    const prazoEntregaConvertido = prazoEntrega
      ? new Date(prazoEntrega)
      : undefined;

    const dataServicoConvertida = dataServico
      ? new Date(dataServico)
      : undefined;

    // Valida as datas, se fornecidas
    if (
      (prazoEntregaConvertido && isNaN(prazoEntregaConvertido.getTime())) ||
      (dataServicoConvertida && isNaN(dataServicoConvertida.getTime()))
    ) {
      return res.status(400).json({
        erro: "Informe datas válidas.",
      });
    }

    // Valida o tipo de horaInicio e horaFim, se fornecidos
    if (
      (typeof horaInicio !== "string" && horaInicio !== undefined) ||
      (horaFim !== undefined && typeof horaFim !== "string")
    ) {
      return res.status(400).json({
        erro: "Informe o horário de início e fim.",
      });
    }

    // Valida o formato de horaInicio e horaFim, se fornecidos
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // Formato HH:mm
    if (
      (horaInicio && !horaRegex.test(horaInicio)) ||
      (horaFim && !horaRegex.test(horaFim))
    ) {
      return res.status(400).json({
        erro: "Informe o horário de início e fim no formato HH:mm.",
      });
    }

    // valida se horaInicio está antes de horaFim, se ambos forem fornecidos
    if (horaInicio && horaFim) {
      const [inicioHoras, inicioMinutos] = horaInicio.split(":").map(Number);
      const [fimHoras, fimMinutos] = horaFim.split(":").map(Number);
      const inicioTotalMinutos = inicioHoras * 60 + inicioMinutos;
      const fimTotalMinutos = fimHoras * 60 + fimMinutos;
      if (inicioTotalMinutos >= fimTotalMinutos) {
        return res.status(400).json({
          erro: "O horário de início deve ser antes do horário de fim.",
        });
      }
    }

    // Cria a proposta no banco
    const proposta = await Proposta.create({
      contratacao: contratacao._id,
      remetente: usuarioId,
      destinatario,
      valor,
      descricao,
      prazoEntrega: prazoEntregaConvertido,
      dataServico: dataServicoConvertida,
      horaInicio,
      horaFim,
      formaPagamento,
    });

    // Atualiza a data da última atividade da conversa
    conversa.atualizadoEm = new Date();
    await conversa.save();

    // Retorna a proposta criada
    return res.status(201).json({
      mensagem: "Proposta enviada com sucesso.",
      proposta,
    });
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      e.code === 11000
    ) {
      return res.status(409).json({
        erro: "Já existe uma proposta pendente nesta contratação.",
      });
    }

    console.error(e);
    return res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

// PATCH /api/propostas/:id/responder
propostaRouter.patch("/:id/responder", exigirLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: usuarioId } = res.locals.usuario;

    // Verifica se a proposta existe e se o usuário tem permissão para respondê-la
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ erro: "Proposta não encontrada." });
    }

    const proposta = await Proposta.findById(id);

    if (!proposta) {
      return res.status(404).json({ erro: "Proposta não encontrada." });
    }

    if (!proposta.destinatario.equals(usuarioId)) {
      return res.status(403).json({
        erro: "Você não tem permissão para responder a esta proposta.",
      });
    }

    // Verifica se a proposta ainda está pendente
    if (proposta.status !== "pendente") {
      return res.status(409).json({
        erro: "Esta proposta não está mais pendente.",
      });
    }

    // Valida a resposta
    const { resposta } = req.body;

    if (resposta !== "aceita" && resposta !== "recusada") {
      return res.status(400).json({
        erro: "Resposta inválida. Use 'aceita' ou 'recusada'.",
      });
    }

    // Busca e valida a contratação
    const contratacao = await Contratacao.findById(proposta.contratacao);

    if (!contratacao) {
      return res.status(404).json({
        erro: "Contratação não encontrada.",
      });
    }

    // Busca e valida a conversa relacionada à contratação
    const conversa = await Conversa.findOne({
      contratacao: contratacao._id,
    });

    if (!conversa) {
      return res.status(404).json({
        erro: "Conversa não encontrada.",
      });
    }

    if (
      !contratacao.artista.equals(conversa.artista) ||
      !contratacao.contratante.equals(conversa.usuario)
    ) {
      return res.status(403).json({
        erro: "A contratação não corresponde aos participantes da conversa.",
      });
    }

    if (
      !(
        (proposta.remetente.equals(conversa.artista) &&
          proposta.destinatario.equals(conversa.usuario)) ||
        (proposta.remetente.equals(conversa.usuario) &&
          proposta.destinatario.equals(conversa.artista))
      )
    ) {
      return res.status(403).json({
        erro: "A proposta não corresponde aos participantes da conversa.",
      });
    }

    if (conversa.status !== "ativa") {
      return res.status(403).json({
        erro: "Esta conversa está encerrada.",
      });
    }

    // Verifica se a contratação permite novas respostas
    if (
      contratacao.status !== "solicitada" &&
      contratacao.status !== "recusada"
    ) {
      return res.status(409).json({
        erro: "Esta contratação não permite novas respostas.",
      });
    }

    // Atualiza o status da proposta
    proposta.status = resposta;
    await proposta.save();

    // Atualiza o status da contratação
    if (resposta === "aceita") {
      contratacao.status = "aceita";
    } else {
      contratacao.status = "recusada";
    }

    await contratacao.save();

    conversa.atualizadoEm = new Date();
    await conversa.save();

    return res.json({
      mensagem: `Proposta ${resposta} com sucesso.`,
      proposta,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      erro: "Erro interno do servidor.",
    });
  }
});

// POST /api/propostas/:id/contraproposta
propostaRouter.post("/:id/contraproposta", exigirLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: usuarioId } = res.locals.usuario;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ erro: "Proposta não encontrada." });
    }

    // Verifica se a proposta existe e se o usuário tem permissão para enviar uma contraproposta
    const proposta = await Proposta.findById(id);

    if (!proposta) {
      return res.status(404).json({ erro: "Proposta não encontrada." });
    }

    // Verifica se o usuário logado é o destinatário da proposta
    if (!proposta.destinatario.equals(usuarioId)) {
      return res.status(403).json({
        erro: "Você não tem permissão para enviar uma contraproposta.",
      });
    }

    // Verifica se a proposta ainda está pendente
    if (proposta.status !== "pendente") {
      return res.status(409).json({
        erro: "Esta proposta não está mais pendente.",
      });
    }

    // Busca e valida a contratação relacionada à proposta
    const contratacao = await Contratacao.findById(proposta.contratacao);

    if (!contratacao) {
      return res.status(404).json({
        erro: "Contratação não encontrada.",
      });
    }

    if (
      contratacao.status !== "solicitada" &&
      contratacao.status !== "recusada"
    ) {
      return res.status(409).json({
        erro: "Esta contratação não aceita contrapropostas.",
      });
    }

    // Busca e valida a conversa relacionada à contratação
    const conversa = await Conversa.findOne({
      contratacao: proposta.contratacao,
    });

    if (!conversa) {
      return res.status(404).json({
        erro: "Conversa não encontrada.",
      });
    }

    if (
      !contratacao.artista.equals(conversa.artista) ||
      !contratacao.contratante.equals(conversa.usuario)
    ) {
      return res.status(403).json({
        erro: "A contratação não corresponde aos participantes da conversa.",
      });
    }

    if (
      !(
        (proposta.remetente.equals(conversa.artista) &&
          proposta.destinatario.equals(conversa.usuario)) ||
        (proposta.remetente.equals(conversa.usuario) &&
          proposta.destinatario.equals(conversa.artista))
      )
    ) {
      return res.status(403).json({
        erro: "A proposta não corresponde aos participantes da conversa.",
      });
    }

    if (conversa.status !== "ativa") {
      return res.status(403).json({
        erro: "Esta conversa está encerrada.",
      });
    }

    // Cria a contraproposta
    const {
      valor,
      descricao,
      prazoEntrega,
      dataServico,
      horaInicio,
      horaFim,
      formaPagamento,
    } = req.body;

    // Valida os campos obrigatórios
    if (
      typeof valor !== "number" ||
      valor < 0 ||
      typeof descricao !== "string" ||
      !descricao.trim() ||
      typeof formaPagamento !== "string" ||
      !formaPagamento.trim()
    ) {
      return res.status(400).json({
        erro: "Informe um valor, uma descrição e uma forma de pagamento válidos.",
      });
    }

    const prazoEntregaConvertido = prazoEntrega
      ? new Date(prazoEntrega)
      : undefined;

    const dataServicoConvertida = dataServico
      ? new Date(dataServico)
      : undefined;

    // Valida as datas, se fornecidas
    if (
      (prazoEntregaConvertido && isNaN(prazoEntregaConvertido.getTime())) ||
      (dataServicoConvertida && isNaN(dataServicoConvertida.getTime()))
    ) {
      return res.status(400).json({
        erro: "Informe datas válidas.",
      });
    }

    // Valida o tipo de horaInicio e horaFim, se fornecidos
    if (
      (typeof horaInicio !== "string" && horaInicio !== undefined) ||
      (horaFim !== undefined && typeof horaFim !== "string")
    ) {
      return res.status(400).json({
        erro: "Informe o horário de início e fim.",
      });
    }

    // Valida o formato de horaInicio e horaFim, se fornecidos
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // Formato HH:mm
    if (
      (horaInicio && !horaRegex.test(horaInicio)) ||
      (horaFim && !horaRegex.test(horaFim))
    ) {
      return res.status(400).json({
        erro: "Informe o horário de início e fim no formato HH:mm.",
      });
    }

    // valida se horaInicio está antes de horaFim, se ambos forem fornecidos
    if (horaInicio && horaFim) {
      const [inicioHoras, inicioMinutos] = horaInicio.split(":").map(Number);
      const [fimHoras, fimMinutos] = horaFim.split(":").map(Number);
      const inicioTotalMinutos = inicioHoras * 60 + inicioMinutos;
      const fimTotalMinutos = fimHoras * 60 + fimMinutos;
      if (inicioTotalMinutos >= fimTotalMinutos) {
        return res.status(400).json({
          erro: "O horário de início deve ser antes do horário de fim.",
        });
      }
    }

    // Atualiza a proposta original, preservando seus dados
    proposta.status = "substituida";
    await proposta.save();

    // Mudança em remetente e destinatário para a contraproposta
    const remetente = proposta.destinatario;
    const destinatario = proposta.remetente;

    // Cria a nova proposta como contraproposta
    const novaProposta = await Proposta.create({
      contratacao: proposta.contratacao,
      remetente,
      destinatario,
      valor,
      descricao,
      prazoEntrega: prazoEntregaConvertido,
      dataServico: dataServicoConvertida,
      horaInicio,
      horaFim,
      formaPagamento,
    });

    // Atualiza o status da contratação para aguardar a resposta da contraproposta
    contratacao.status = "solicitada";
    await contratacao.save();

    // Atualiza a data da última atividade da conversa
    conversa.atualizadoEm = new Date();
    await conversa.save();

    return res.status(201).json({
      mensagem: "Contraproposta enviada com sucesso.",
      proposta: novaProposta,
    });
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      e.code === 11000
    ) {
      return res.status(409).json({
        erro: "Já existe uma proposta pendente nesta contratação.",
      });
    }

    console.error(e);

    return res.status(500).json({
      erro: "Erro interno do servidor.",
    });
  }
});

export { conversaRouter, propostaRouter };