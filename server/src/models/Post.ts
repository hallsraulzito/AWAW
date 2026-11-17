import { Schema, model } from "mongoose";

/*
  POST = uma publicação do feed (texto + até 4 imagens + hashtags).

  - autor: REFERÊNCIA ao usuário (muitos posts por usuário).
  - midias e tags: EMBUTIDOS (sempre lidos junto com o post).
  - curtidas: array com os _id de quem curtiu. Simples e suficiente para
    começar. Se um post chegar a dezenas de milhares de curtidas, o ideal é
    migrar para uma coleção própria (lembra a regra "o que cresce sem parar
    ganha coleção própria"?).
*/
const postSchema = new Schema(
  {
    autor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    texto: { type: String, trim: true, maxlength: 500, default: "" },
    midias: [{ _id: false, url: { type: String, required: true } }],
    tags: { type: [String], index: true }, // hashtags sem o "#", em minúsculas
    curtidas: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: { createdAt: "criadoEm", updatedAt: "atualizadoEm" } }
);

export const Post = model("Post", postSchema);
