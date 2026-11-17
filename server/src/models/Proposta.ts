import { Schema, model } from "mongoose";

const propostaSchema = new Schema(
  {
    //Relacionamentos
    contratacao: {
      type: Schema.Types.ObjectId,
      ref: "Contratacao",
      required: true,
    },
    remetente: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    destinatario: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    //Variavéis da proposta
    valor: { type: Number, required: true, min: 0 },
    descricao: { type: String, required: true },
    prazoEntrega: { type: Date, required: false },
    dataServico: { type: Date, required: false },
    horaInicio: { type: String, required: false },
    horaFim: { type: String, required: false },
    formaPagamento: { type: String, required: true },
    status: {
      type: String,
      enum: ["pendente", "aceita", "recusada", "substituida"],
      required: true,
      default: "pendente",
    },
  },

  {
    //Timestamps
    timestamps: {
      createdAt: "dataSolicitacao",
      updatedAt: "atualizadoEm",
    },
  },
);

propostaSchema.index(
  { contratacao: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pendente" },
  },
);

export const Proposta = model("Proposta", propostaSchema);
