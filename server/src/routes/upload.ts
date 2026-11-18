
import { Router } from "express";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { exigirLogin } from "../middleware/auth.js";

const router = Router();

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const TAMANHO_MAXIMO = 8 * 1024 * 1024;

router.post(
  "/",
  (req, res, next) => {
    if (req.body?.type === "blob.upload-completed") {
      return next();
    }

    exigirLogin(req, res, next);
  },
  async (req, res) => {
    try {
      const resultado = await handleUpload({
        body: req.body as HandleUploadBody,
        request: req,

        onBeforeGenerateToken: async () => {
          return {
            allowedContentTypes: TIPOS_PERMITIDOS,
            maximumSizeInBytes: TAMANHO_MAXIMO,
            addRandomSuffix: true,
          };
        },

        onUploadCompleted: async ({ blob }) => {
          console.log("Upload concluído:", blob.url);
        },
      });

      return res.status(200).json(resultado);
    } catch (erro) {
      console.error("Erro no upload:", erro);

      return res.status(400).json({
        erro: "Não foi possível processar o envio das imagens.",
      });
    }
  },
);

export default router;
