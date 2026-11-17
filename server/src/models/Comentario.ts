import { Schema, model } from "mongoose";

// COMENTARIO: coleção separada porque um post pode ter muitos comentários.
const comentarioSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    autor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    texto: { type: String, required: true, trim: true, maxlength: 300 },
  },
  { timestamps: { createdAt: "criadoEm", updatedAt: false } }
);
comentarioSchema.index({ post: 1, criadoEm: 1 }); // lista os comentários de um post em ordem

export const Comentario = model("Comentario", comentarioSchema);
